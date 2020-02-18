import Joi from 'joi';
import jwt from 'jsonwebtoken';

export default class UserService {
	constructor(userRepo, secretKey) {
		this.userRepo = userRepo;
		this.secretKey = secretKey;
	}

	getUserLoginValidationSchema() {
		return Joi.object()
			.keys({
				email: Joi.string().email({ minDomainAtoms: 2 }),
				password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/)
			})
			.with('email', 'password');
	}

	getUserValidationSchema() {
		return Joi.object()
			.keys({
				id: Joi.number()
					.integer()
					.min(0)
					.max(2020),
				email: Joi.string().email({ minDomainAtoms: 2 }),
				givenName: Joi.string()
					.alphanum()
					.min(3)
					.max(30)
					.required(),
				familyName: Joi.string()
					.alphanum()
					.min(3)
					.max(30)
					.required(),
				password: Joi.string()
					.regex(/^[a-zA-Z0-9]{3,30}$/)
					.required(),
				about: Joi.string()
					.regex(/^[a-zA-Z0-9 .-:;]{3,255}$/)
					.required()
			})
			.with('email', 'password');
	}

	validateUser(id, email, givenName, familyName, password, about) {
		const { error, value } = Joi.validate(
			{ id, email, givenName, familyName, password, about },
			this.getUserValidationSchema()
		);
		return this.isValid(error, value);
	}

	validateLogin(email, password) {
		const { error, value } = Joi.validate(
			{ email, password },
			this.getUserLoginValidationSchema()
		);
		return this.isValid(error, value);
	}

	isValid(error, value) {
		if (error) {
			console.log(error.details, value);
			return false;
		}
		return true;
	}

	generateAuthToken(email, password) {
		return jwt.sign({ email, password }, this.secretKey);
	}

	async doLogin(email, password) {
		const user = await this.userRepo.getUserByEmailPassword(email, password);
		return user ? true : false;
	}

	async saveToken(email, password, token) {
		const savedToken = await this.userRepo.saveAuthToken(
			email,
			password,
			token
		);
		return savedToken ? true : false;
	}

	async insertUser(id, email, givenName, familyName, password, about) {
		const currentDate = new Date();
		let user;
		if (!(await this.userRepo.findUserByEmail(email))) {
			user = await this.userRepo.insertUser(
				id,
				email,
				givenName,
				familyName,
				currentDate.toISOString(),
				password,
				about
			);
		}
		return user ? true : false;
	}

	async updateUser(_id, id, email, givenName, familyName, password, about) {
		const existingUser = await this.userRepo.findUserByEmail(email);
		let user;
		if (existingUser) {
			if (existingUser._id === _id) {
				user = await this.userRepo.updateUser(
					_id,
					id,
					email,
					givenName,
					familyName,
					password,
					about
				);
			}
		}
		return user ? true : false;
	}
}
