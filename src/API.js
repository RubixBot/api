// Connect to the gateway and start up the API.
let config;
if (process.env.DEV === 'true') {
  config = require('../config.dev');
} else {
  config = require('../config');
}

const sentry = require('@sentry/node');
const Database = require('./Database');
const Redis = require('ioredis');
const RequestHandler = require('./rest/RequestHandler');

module.exports = class API {

  constructor (id, worker, logger) {
    // Init Sentry
    if (config.sentry) {
      sentry.init({
        dsn: config.sentry
      });
    }

    this.config = config;
    this.gatewayClient = worker;
    this.logger = logger;
    this.config = config;
    this.id = id;
    this.startedAt = Date.now();
    this.redis = new Redis(config.redis);
    this.rest = new RequestHandler(logger, { token: config.token });
    this.db = new Database(config.db);

    this.start();
  }

  async start () {
    await this.db.connect();
  }

};
