import { ObjectID } from 'mongodb';

export default class DatabaseRepository {
	constructor(mongoClient, db, collection) {
		this.mongoClient = mongoClient;
		this.db = db;
		this.collection = collection;
	}

	async getUserByEmailPassword(email, password) {
		const dbConn = await this.mongoClient.getMongoDBConnection();
		const user = await this.mongoClient.findOne(
			dbConn,
			this.db,
			this.collection,
			{
				email,
				password
			}
		);
		await this.mongoClient.closeConnection(dbConn);
		return user;
	}

	async getUserByEmail(email) {
		const dbConn = await this.mongoClient.getMongoDBConnection();
		const user = await this.mongoClient.findOne(
			dbConn,
			this.db,
			this.collection,
			{
				email
			}
		);
		await this.mongoClient.closeConnection(dbConn);
		return user;
	}

	async getUserByDBID(id) {
		const dbConn = await this.mongoClient.getMongoDBConnection();
		const user = await this.mongoClient.findOne(
			dbConn,
			this.db,
			this.collection,
			{
				_id: ObjectID(id)
			}
		);
		await this.mongoClient.closeConnection(dbConn);
		return user;
	}

	async updateUser(_id, id, email, givenName, familyName, password, about) {
		const dbConn = await this.mongoClient.getMongoDBConnection();
		const user = await this.mongoClient.updateOne(
			dbConn,
			this.db,
			this.collection,
			{
				_id: ObjectID(_id)
			},
			{
				id,
				email,
				givenName,
				familyName,
				password,
				about
			}
		);
		await this.mongoClient.closeConnection(dbConn);
		return user;
	}

	async insertUser(id, email, givenName, familyName, created, password, about) {
		const dbConn = await this.mongoClient.getMongoDBConnection();
		const user = await this.mongoClient.insertOne(
			dbConn,
			this.db,
			this.collection,
			{
				id,
				email,
				givenName,
				familyName,
				created,
				password,
				about
			}
		);
		await this.mongoClient.closeConnection(dbConn);
		return user;
	}

	async saveAuthToken(email, password, token) {
		const dbConn = await this.mongoClient.getMongoDBConnection();
		const user = await this.mongoClient.updateOne(
			dbConn,
			this.db,
			this.collection,
			{
				email,
				password
			},
			{
				token
			}
		);
		await this.mongoClient.closeConnection(dbConn);
		return user;
	}

	async deleteUser(_id) {
		const dbConn = await this.mongoClient.getMongoDBConnection();
		const user = await this.mongoClient.deleteOne(
			dbConn,
			this.db,
			this.collection,
			{
				_id: ObjectID(_id)
			}
		);
		await this.mongoClient.closeConnection(dbConn);
		return user;
	}

	async getAllUsers() {
		const dbConn = await this.mongoClient.getMongoDBConnection();
		const users = await this.mongoClient.findAll(
			dbConn,
			this.db,
			this.collection
		);
		await this.mongoClient.closeConnection(dbConn);
		return users;
	}
}
