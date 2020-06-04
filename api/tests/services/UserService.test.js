// Mongo exceptions take a long time to appear.
jest.setTimeout(45000);

import UserService from '../../src/services/UserService';
import MongoConnection from '../../src/connection/MongoConnection';
import UserRepository from '../../src/repository/UserRepository';
import { dbSetup, dbTeardown } from '../fixture/mongoDBFixture';
import {
	validID,
	validGivenName,
	validFamilyName,
	validAbout,
	validEmail,
	validPwd,
	invalidEmail,
	invalidPwd,
	validUsername,
	validPassword,
	validHost,
	validAuthDB,
	validDB,
	validCreated,
	invalidUnderscoreID,
	invalidCollection,
	validToken,
	secretKey,
	validNotExistingUser,
} from '../fixture/CommonData';
import { fail } from 'assert';

describe('User Service', () => {
	const validCollection = 'userServiceTest';
	const validDuplicateEmail = 'tom@holextra.com';
	const invalidID = -1;
	const validLoginResult = true;
	const invalidLoginResult = false;
	const validUserResult = true;
	const invalidUserResult = false;
	const invalidUserToken = null;
	const validSaveUserToken = true;
	const invalidSaveUserToken = false;
	const validDuplicateByEmail = true;
	const invalidDuplicateByEmail = false;
	const validUserUpdate = true;
	const invalidUserUpdate = false;
	const validDeleteUser = true;
	const invalidDeleteUser = false;
	const invalidGetUser = null;
	const invalidCollectionError = 'collection name must be a String';

	let mongoConn;
	let userRepo;
	let userService;

	beforeEach(async () => {
		await dbSetup(
			validUsername,
			validPassword,
			validHost,
			validAuthDB,
			validDB,
			validCollection
		);
		mongoConn = new MongoConnection(
			validUsername,
			validPassword,
			validHost,
			validAuthDB,
			validDB
		);
		userRepo = new UserRepository(mongoConn, validCollection);
		userService = new UserService(userRepo, secretKey);
	});

	afterEach(async () => {
		await dbTeardown(
			validUsername,
			validPassword,
			validHost,
			validAuthDB,
			validDB,
			validCollection
		);
	});

	it('Will return user validation schema', () => {
		const schema = userService.getUserValidationSchema();
		expect(schema).toMatchSnapshot();
	});

	it('Will return email and password validation schema', () => {
		const schema = userService.getUserLoginValidationSchema();
		expect(schema).toMatchSnapshot();
	});

	it('Will return true for a valid login', async () => {
		const login = await userService.doLogin(validEmail, validPwd);
		expect(login).toBe(validLoginResult);
	});

	it('Will return false for an invalid password on login', async () => {
		const failLogin = await userService.doLogin(validEmail, invalidPwd);
		expect(failLogin).toBe(invalidLoginResult);
	});

	it('Will return false for an invalid email on login', async () => {
		const failLogin = await userService.doLogin(validEmail, invalidPwd);
		expect(failLogin).toBe(invalidLoginResult);
	});

	it('Will validate valid emails and password successfully', () => {
		const valid = userService.validateLogin(validEmail, validPwd);
		expect(valid).toBe(validLoginResult);
	});

	it('Will fail validation of invalid emails and valid passwords', () => {
		const invalid = userService.validateLogin(invalidEmail, validPwd);
		expect(invalid).toBe(invalidLoginResult);
	});

	it('Will fail validation of valid emails and invalid passwords', () => {
		const invalid = userService.validateLogin(validEmail, invalidPwd);
		expect(invalid).toBe(invalidLoginResult);
	});

	it('Will validate valid user details successfully', () => {
		const valid = userService.validateUser(
			validID,
			validEmail,
			validGivenName,
			validFamilyName,
			validPwd,
			validAbout
		);
		expect(valid).toBe(true);
	});

	it('Will fail validation of invalid user details', () => {
		const invalid = userService.validateUser(
			invalidID,
			validEmail,
			validGivenName,
			validFamilyName,
			validPwd,
			validAbout
		);
		expect(invalid).toBe(false);
	});

	it('Will generate an auth token', () => {
		const token = userService.generateAuthToken(validEmail, validPwd);
		expect(token).not.toBe(invalidUserToken);
	});

	it('Will save a user token', async () => {
		const savedToken = await userService.saveToken(
			validEmail,
			validPwd,
			validToken
		);
		expect(savedToken).toBe(validSaveUserToken);
	});

	it('Will fail to save a user token when an email is not found', async () => {
		const savedToken = await userService.saveToken(
			invalidEmail,
			validPwd,
			validToken
		);
		expect(savedToken).toBe(invalidSaveUserToken);
	});

	it('Will insert a new user', async () => {
		const user = await userService.insertUser(
			validNotExistingUser.id,
			validNotExistingUser.email,
			validNotExistingUser.givenname,
			validNotExistingUser.familyname,
			validNotExistingUser.password,
			validNotExistingUser.about
		);
		expect(user).toBe(validUserResult);
	});

	it('Will fail to save a new user', async () => {
		const user = await userService.insertUser(
			validNotExistingUser.id,
			validEmail,
			validNotExistingUser.givenname,
			validNotExistingUser.familyname,
			validNotExistingUser.password,
			validNotExistingUser.about
		);
		expect(user).toBe(invalidUserResult);
	});

	it('Will find a duplicate user by email', async () => {
		const userByEmail = await userRepo.getUserByEmail(validEmail);
		await userRepo.insertUser(
			validID,
			validEmail,
			validGivenName,
			validFamilyName,
			validCreated,
			validPassword
		);
		const user = await userService.isUserEmailDuplicated(
			userByEmail._id,
			validEmail
		);
		expect(user).toBe(validDuplicateByEmail);
	});

	it('Will not find a duplicate user by email', async () => {
		const userByEmail = await userRepo.getUserByEmail(validEmail);
		const user = await userService.isUserEmailDuplicated(
			userByEmail._id,
			validEmail
		);
		expect(user).toBe(invalidDuplicateByEmail);
	});

	it('Will update a user', async () => {
		const userByEmail = await userRepo.getUserByEmail(validEmail);
		const user = await userService.updateUser(
			userByEmail._id,
			validNotExistingUser.id,
			validEmail,
			validNotExistingUser.givenname,
			validNotExistingUser.familyname,
			validNotExistingUser.password,
			validNotExistingUser.about
		);
		expect(user).toBe(validUserUpdate);
	});

	it('Will fail to update a user on duplicate email', async () => {
		const userByEmail = await userRepo.getUserByEmail(validEmail);
		const user = await userService.updateUser(
			userByEmail._id,
			validNotExistingUser.id,
			validDuplicateEmail,
			validNotExistingUser.givenname,
			validNotExistingUser.familyname,
			validNotExistingUser.password,
			validNotExistingUser.about
		);
		expect(user).toBe(invalidUserUpdate);
	});

	it('Will delete a user', async () => {
		const userByEmail = await userRepo.getUserByEmail(validEmail);
		const user = await userService.deleteUser(userByEmail._id);
		expect(user).toBe(validDeleteUser);
	});

	it('Will fail to delete a user', async () => {
		const user = await userService.deleteUser(invalidUnderscoreID);
		expect(user).toBe(invalidDeleteUser);
	});

	it('Will get a user', async () => {
		const userByEmail = await userRepo.getUserByEmail(validEmail);
		const user = await userService.getUser(userByEmail._id);
		delete user._id;
		expect(user).toMatchSnapshot();
	});

	it('Will fail to get a user', async () => {
		const user = await userService.getUser(invalidUnderscoreID);
		expect(user).toBe(invalidGetUser);
	});

	it('Will get all users', async () => {
		const users = await userService.getAllUsers();
		expect(users).toMatchSnapshot();
	});

	it('Will fail to get all users', async () => {
		try {
			const badUserRepo = new UserRepository(mongoConn, invalidCollection);
			const badUserService = new UserService(badUserRepo, secretKey);
			await badUserService.getAllUsers();
			fail();
		} catch (e) {
			expect(e.message).toBe(invalidCollectionError);
		}
	});
});
