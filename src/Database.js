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


  // Levelling
  getUserXP (guild_id, user_id) {
    return this.db.collection('levels').findOne({ guild_id, user_id });
  }

  getLevelXP (level) {
    return 5 * (level ** 2) + 30 * level + 80;
  }

  getLevelFromXP (xp) {
    let remaining = Number(xp);
    let level = 0;

    while (remaining >= this.getLevelXP(level)) {
      remaining -= this.getLevelXP(level);
      level += 1;
    }

    return level;
  }

  getRemainingXP (level, xp) {
    let total = 0;
    for (let i = 0; i < level; i++) {
      total += this.getLevelXP(i);
    }

    return xp - total;
  }

  getTotalRanks (guild_id) {
    return this.db.collection('levels').countDocuments({ guild_id });
  }

  getGuildLeaderboard (guild_id) {
    return this.db.collection('levels').find({ guild_id }, { $sort: { experience: 1 } }).toArray();
  }

  async getRankPosition (guild_id, user_id) {
    return (await this.getGuildLeaderboard(guild_id)).map(s => s.user_id).indexOf(user_id) + 1;
  }

  resetUserXP (guild_id, user_id) {
    return this.db.collection('levels').updateOne({ guild_id, user_id }, { $set: { experience: 0 } }, { $upsert: true });
  }

  resetServerXP (guild_id) {
    return this.db.collection('levels').updateMany({ guild_id }, { $set: { experience: 0 } }, { $upsert: true });
  }

};
