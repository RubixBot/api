const config = require(`../../config${process.env.PROD === 'true' ? '' : '.dev'}.json`);
const Redis = require('ioredis');
const redis = new Redis(config.redis);

// { max: 5, window: 5000 }
module.exports = ({ max, window }) => {
  let resetAt = Date.now() + window;
  setInterval(() => resetAt = Date.now() + window, window);

  return async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const keyPrefix = `${req.baseUrl}:${ip}`;

    const exists = await redis.exists(`${keyPrefix}:used`);
    const requestsUsed = exists ? await redis.get(`${keyPrefix}:used`) : 0;

    res.set('X-RateLimit-Limit', max);
    res.set('X-RateLimit-Remaining', requestsUsed === max ? 0 : max - requestsUsed - 1);
    res.set('X-RateLimit-Reset', resetAt / 1000);

    if (requestsUsed === max) {
      res.set('Retry-After', (resetAt - Date.now()) / 1000);

      return res.status(429).json({ message: 'You are being rate limited' }).end();
    } else {
      if (exists) await redis.incr(`${keyPrefix}:used`);
      else await redis.set(`${keyPrefix}:used`, requestsUsed + 1, 'PX', resetAt - Date.now());

      return next();
    }
  };
};
