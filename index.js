// Connect to the gateway and start up the interactions server.
let config = require(`./config${process.env.PROD === 'true' ? '' : '.dev'}.json`);

const API = require('./src/API');
const winston = require('winston');

// Create a logger
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((info) => {
      const data = Object.assign({}, info, {
        level: undefined,
        message: undefined,
        splat: undefined,
        label: undefined,
        timestamp: undefined
      });
      let string = `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`;
      Object.keys(data).map(key => data[key] ? `${key}=${data[key]}` : '').forEach(d => string += ` ${d}`);
      return string;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'log.log' })
  ]
});

// Connect up

new API(config, logger).start();
process.on('unhandledRejection', err => logger.error(`Unhandled Rejection: ${err.stack}`));
