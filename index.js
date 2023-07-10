// Connect to the gateway and start up the interactions server.
let config;
if (process.env.DEV === 'true') {
  config = require('./config.dev');
} else {
  config = require('./config');
}

const GatewayClient = require('./src/gateway/');
const API = require('./src/API');
const winston = require('winston');

// Create a logger
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message} ${JSON.stringify(Object.assign({}, info, {
      level: undefined,
      message: undefined,
      splat: undefined,
      label: undefined,
      timestamp: undefined
    }))}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'log.log' })
  ]
});

// Connect up
const worker = new GatewayClient(config.gateway.use, 'api', config.gateway.address, config.gateway.secret);

worker
  .on('error', (err) => logger.error(err, { src: 'gateway' }))
  .on('connect', (ms) => logger.info(`Connected in ${ms}ms`, { src: 'gateway' }))
  .once('ready', ({ id }) => new API(id, worker, logger));

worker.connect();
process.on('unhandledRejection', err => logger.error(`Unhandled Rejection: ${err.stack}`));
