// Connect to the gateway and start up the API.
const sentry = require('@sentry/node');
const Database = require('./Database');
const Redis = require('ioredis');
const cors = require('cors');
const express = require('express');

// Versions
const api = require('./api/');

module.exports = class API {

  constructor (config, logger) {
    // Init Sentry
    if (config.sentry) {
      sentry.init({
        dsn: config.sentry
      });
    }

    this.config = config;
    this.logger = logger;

    this.startedAt = Date.now();
    this.redis = new Redis(config.redis);
    this.db = new Database(config.db);
    this.app = express();

    Object.assign(this.app.locals, { db: this.db, redis: this.db });
  }

  async start () {
    await this.db.connect();

    this.app.use(express.json());
    this.app.use(cors());
    this.app.use('/', api());

    this.app.listen(this.config.port);
    this.logger.info('started', { port: this.config.port });
  }

};
