// Database Handler
const { MongoClient } = require('mongodb');

module.exports = class Database {

  constructor (config) {
    this._config = config;
  }

  async connect () {
    const client = await MongoClient.connect(this._config.url, { useUnifiedTopology: true });
    this.db = client.db();
  }

  // Guild Functions
  async getGuildSettings (id) {
    const settings = await this.db.collection('guilds').findOne({ _id: id });
    return settings ? { ...settings, _id: undefined } : {};
  }

  async updateGuildSettings (id, data) {
    const settings = await this.db.collection('guilds').findOne({ _id: id });

    if (!settings) {
      await this.db.collection('guilds').insertOne({ _id: id });
    }

    return this.db.collection('guilds').updateOne({ _id: id }, { $set: data }, { $upsert: true });
  }


  // User Functions
  async getUserSettings (id) {
    const settings = await this.db.collection('users').findOne({ _id: id });
    return settings || {};
  }

  async updateUserSettings (id, data) {
    const settings = await this.db.collection('users').findOne({ _id: id });

    if (!settings) {
      await this.db.collection('users').insertOne({ _id: id });
    }

    await this.db.collection('users').updateOne({ _id: id }, { $set: data });
  }

  // Timed Actions
  getDueTimedActions () {
    return this.db.collection('timedActions').find().max({ expires: Date.now() }).toArray();
  }

  getAllTimedActions () {
    return this.db.collection('timedActions').find().toArray();
  }

  createTimedAction (type, expires, data = {}) {
    return this.db.collection('timedActions').insertOne({
      type,
      expires,
      ...data
    });
  }

  deleteTimedAction (id) {
    return this.db.collection('timedActions').findOneAndDelete({ _id: id });
  }


  // Custom Commands
  createCustomCommand (guildID, name, creator, message) {
    return this.db.collection('customCommands').insertOne({ guildID, name, creator, message });
  }

  editCustomCommand (guildID, name, message) {
    return this.db.collection('customCommands').updateOne({ guildID, name }, { $set: { message } }, { $upsert: true });
  }

  async getCustomCommand (guildID, name) {
    const command = await this.db.collection('customCommands').findOne({ guildID, name });
    if (command) return { name, creator: command.creator, message: command.message };
    else return null;
  }

  async getCustomCommands (guildID) {
    const commands = await this.db.collection('customCommands').find({ guildID }).toArray();
    return commands.map((c) => ({ name: c.name, creator: c.creator, message: c.message }));
  }

  deleteCustomCommand (guildID, name) {
    return this.db.collection('customCommands').findOneAndDelete({ guildID, name });
  }


  // Moderation Log
  removeGuildCases (guildID) {
    return this.db.collection('modlog').deleteMany({ guildID });
  }

  getGuildCases (guildID) {
    return this.db.collection('modlog').find({ guildID }).toArray();
  }

  createCase (data) {
    return this.db.collection('modlog').insertOne(data);
  }

  getCase (guildID, caseID) {
    return this.db.collection('modlog').findOne({ _id: `${guildID}.${caseID}` });
  }

  getUserCases (targetID, guildID) {
    return this.db.collection('modlog').find({ targetID, guildID }).toArray();
  }

  updateCase (guildID, caseID, newData) {
    return this.db.collection('modlog').updateOne({ _id: `${guildID}.${caseID}` }, { $set: newData });
  }

  deleteCase (guildID, caseID) {
    return this.db.collection('modlog').findOneAndDelete({ guildID, caseID });
  }

  getUserWarnings (guildID, targetID) {
    return this.db.collection('modlog').find({ targetID, guildID, action: 'warn' }).toArray();
  }

};
