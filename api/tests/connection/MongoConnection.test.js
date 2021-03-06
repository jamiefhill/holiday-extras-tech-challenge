// Mongo exceptions take a long time to appear.
jest.setTimeout(45000);

import MongoConnection from '../../src/connection/MongoConnection';
import { dbSetup, dbTeardown } from '../fixture/mongoDBFixture';
import {
	validUsername,
	validPassword,
	validDB,
	validAuthDB,
	validHost,
	validEmail,
	invalidEmail,
	validNoFoundDocument,
	validInsertDocument,
	validDeleteResult,
	invalidDeleteResult,
	validAllDocsLength,
	validNotExistingUser,
} from '../fixture/CommonData';
import { fail } from 'assert';

describe('MongoConnection', () => {
	const validCollection = 'test';
	const validAllDocsQuery = {};
	const validUpdateResult = true;
	const invalidUpdateResult = false;
	const validNoDocsLength = 0;
	const invalidUsername = 'notvalid';
	const invalidPassword = 'password1';
	const invalidHost = 'remotehost';
	const invalidAuthDB = 'blah';
	const invalidDB = 'nodb';
	const invalidCollection = 'nocollection';
	const invalidInsert = null;
	const authenticationFailedMessage = 'Authentication failed.';
	const invalidHostMessage = 'getaddrinfo ENOTFOUND remotehost';
	const invalidDBMessage = 'not authorized on nodb to execute command';
	const invalidInsertMessage = "Cannot read property '_id' of null";
	const invalidDuplicateInsertMessage =
		'E11000 duplicate key error collection:';
	const validQuery = {
		email: validEmail,
	};

	const validUpdate = {
		email: invalidEmail,
	};
	const validDelete = {
		email: validEmail,
	};
	const invalidQuery = {
		email: invalidEmail,
	};
	const invalidUpdate = {
		email: validEmail,
	};
	const invalidDelete = {
		email: invalidEmail,
	};

	let mongoConn;

	beforeEach(async () => {
		mongoConn = new MongoConnection(
			validUsername,
			validPassword,
			validHost,
			validAuthDB,
			validDB
		);
		await dbSetup(
			validUsername,
			validPassword,
			validHost,
			validAuthDB,
			validDB,
			validCollection
		);
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

	it('Will return Mongo Connection options', () => {
		const connectionOptions = mongoConn.getConnectionOptions();
		expect(connectionOptions).toMatchSnapshot();
	});

	it('Will find one result', async () => {
		const docResult = await mongoConn.findOne(validCollection, validQuery);
		delete docResult._id;
		expect(docResult).toMatchSnapshot();
	});

	it('Will throw an error on invalid username', async (done) => {
		const badMongoConn = new MongoConnection(
			invalidUsername,
			validPassword,
			validHost,
			validAuthDB,
			validDB
		);
		try {
			await badMongoConn.findOne(validQuery);
			fail();
		} catch (e) {
			expect(e.message).toBe(authenticationFailedMessage);
			done();
		}
	});

	it('Will throw an error on invalid password', async (done) => {
		const badMongoConn = new MongoConnection(
			validUsername,
			invalidPassword,
			validHost,
			validAuthDB,
			validDB
		);
		try {
			await badMongoConn.findOne(validCollection, validQuery);
			fail();
		} catch (e) {
			expect(e.message).toBe(authenticationFailedMessage);
			done();
		}
	});

	it('Will throw an error on invalid host', async (done) => {
		const badMongoConn = new MongoConnection(
			validUsername,
			validPassword,
			invalidHost,
			validAuthDB,
			validDB
		);
		try {
			await badMongoConn.getMongoDBConnection();
			fail();
		} catch (e) {
			expect(e.message).toBe(invalidHostMessage);
			done();
		}
	});

	it('Will throw an error on invalid authdb', async (done) => {
		const badMongoConn = new MongoConnection(
			validUsername,
			validPassword,
			validHost,
			invalidAuthDB,
			validDB
		);
		try {
			await badMongoConn.findOne(validCollection, validQuery);
			fail();
		} catch (e) {
			expect(e.message).toBe(authenticationFailedMessage);
			done();
		}
	});

	it('Will throw an error on invalid db', async (done) => {
		const badMongoConn = new MongoConnection(
			validUsername,
			validPassword,
			validHost,
			validAuthDB,
			invalidDB
		);
		try {
			await badMongoConn.findOne(validCollection, validQuery);
			fail();
		} catch (e) {
			expect(e.message).toMatch(invalidDBMessage);
			done();
		}
	});

	it('Will return nothing when nothing is found', async () => {
		const noResult = await mongoConn.findOne(validCollection, invalidQuery);
		expect(noResult).toBe(validNoFoundDocument);
	});

	it('Will return nothing when nothing is found', async () => {
		const noResult = await mongoConn.findOne(invalidCollection, validQuery);
		expect(noResult).toBe(validNoFoundDocument);
	});

	it('Will fail to insert to the same document twice', async () => {
		try {
			const docResult = await mongoConn.findOne(validCollection, validQuery);
			await mongoConn.insertOne(validCollection, docResult);
			fail();
		} catch (e) {
			expect(e.message).toMatch(invalidDuplicateInsertMessage);
		}
	});

	it('Will update the database with new values', async () => {
		const update = await mongoConn.updateOne(
			validCollection,
			validQuery,
			validUpdate
		);
		expect(update).toBe(validUpdateResult);
	});

	it('Will fail to update the database with new values on an invalid query', async () => {
		const update = await mongoConn.updateOne(
			validCollection,
			invalidQuery,
			validUpdate
		);
		expect(update).toBe(invalidUpdateResult);
	});

	it('Will fail to update the database with new values on an invalid update', async () => {
		const update = await mongoConn.updateOne(
			validCollection,
			validQuery,
			invalidUpdate
		);
		expect(update).toBe(invalidUpdateResult);
	});

	it('Will fail to update the database with an invalid collection', async () => {
		const update = await mongoConn.updateOne(
			invalidCollection,
			validQuery,
			validUpdate
		);
		expect(update).toBe(invalidUpdateResult);
	});

	it('Will throw an error when trying to update on an invalid database', async () => {
		try {
			const badMongoConn = new MongoConnection(
				validUsername,
				validPassword,
				validHost,
				validAuthDB,
				invalidDB
			);
			await badMongoConn.updateOne(invalidCollection, validQuery, validUpdate);
			fail();
		} catch (e) {
			expect(e.message).toMatch(invalidDBMessage);
		}
	});

	it('Will insert to the database with new values', async () => {
		const insert = await mongoConn.insertOne(
			validCollection,
			validNotExistingUser
		);
		expect(insert).toBe(validInsertDocument);
	});

	it('Will create a new collection if the collection does not exist', async () => {
		const insert = await mongoConn.insertOne(
			invalidCollection,
			validNotExistingUser
		);
		// Mongo Default behaviour is to create collections that do not exist.
		expect(insert).toBe(validInsertDocument);
		// Teardown
		await dbTeardown(
			validUsername,
			validPassword,
			validHost,
			validAuthDB,
			validDB,
			invalidCollection
		);
	});

	it('Will fail to insert to the database with an invalid document', async (done) => {
		try {
			await mongoConn.insertOne(validCollection, invalidInsert);
			fail();
		} catch (e) {
			expect(e.message).toBe(invalidInsertMessage);
			done();
		}
	});

	it('Will delete a document', async () => {
		const deleteDoc = await mongoConn.deleteOne(validCollection, validDelete);
		expect(deleteDoc).toBe(validDeleteResult);
	});

	it('Will not delete a not found document', async () => {
		const deleteDoc = await mongoConn.deleteOne(validCollection, invalidDelete);
		expect(deleteDoc).toBe(invalidDeleteResult);
	});

	it('Will not delete a document in a not found collection', async () => {
		const deleteDoc = await mongoConn.deleteOne(invalidCollection, validDelete);
		expect(deleteDoc).toBe(invalidDeleteResult);
	});

	it('Will throw an error when trying to delete from an invalid database', async () => {
		try {
			const badMongoConn = new MongoConnection(
				validUsername,
				validPassword,
				validHost,
				validAuthDB,
				invalidDB
			);
			await badMongoConn.deleteOne(invalidCollection, validDelete);
			fail();
		} catch (e) {
			expect(e.message).toMatch(invalidDBMessage);
		}
	});

	it('Will not find any documents for an invalid collection', async () => {
		const foundDoc = await mongoConn.findAllByQuery(
			invalidCollection,
			validQuery
		);
		expect(foundDoc.length).toBe(validNoDocsLength);
	});

	it('Will find all documents by query', async () => {
		const foundDoc = await mongoConn.findAllByQuery(
			validCollection,
			validAllDocsQuery
		);
		expect(foundDoc.length).toBe(validAllDocsLength);
	});

	it('Will throw an error on find all docs by query', async (done) => {
		try {
			const badMongoConn = new MongoConnection(
				validUsername,
				validPassword,
				validHost,
				validAuthDB,
				invalidDB
			);
			await badMongoConn.findAllByQuery(invalidCollection, validAllDocsQuery);
			fail();
		} catch (e) {
			expect(e.message).toMatch(invalidDBMessage);
			done();
		}
	});
});
