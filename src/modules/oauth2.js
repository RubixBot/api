// Imports
const superagent = require('superagent');
const config = require(`../../config${process.env.PROD === 'true' ? '' : '.dev'}.json`);
const Redis = require('ioredis');
const redis = new Redis(config.redis);

async function generateUserToken (code) {
  try {
    const { body } = await superagent.post('https://discord.com/api/oauth2/token')
      .type('form')
      .send({
        client_id: config.applicationID,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.redirectURI
      });

    const userToken = crypto.randomUUID();
    await redis.set(`api:token:${userToken}`, JSON.stringify({
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt: Date.now() + (body.expires_in * 1000)
    }));

    return userToken;
  } catch (err) {
    throw new Error('Invalid OAuth2 code');
  }
}

async function getActivitiesAccessToken (code) {
  let body;
  try {
    body = (await superagent.post('https://discord.com/api/oauth2/token')
      .type('form')
      .send({
        client_id: config.applicationID,
        client_secret: config.clientSecret,
        grant_type: 'authorization_code',
        code: code
      })).body;
  } catch (e) {
    throw new Error(e.message);
  }

  return body.access_token;
}

/*
    Get a users access token.
  */
async function getAccessToken (userToken) {
  if (!await redis.exists(`api:token:${userToken}`)) {
    throw new Error('Invalid token');
  }

  const token = JSON.parse(await redis.get(`api:token:${userToken}`));
  if (Date.now() >= token.expiresAt) {
    try {
      const { body } = await superagent.post('https://discord.com/api/oauth2/token')
        .type('form')
        .send({
          client_id: config.applicationID,
          client_secret: config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken,
          redirect_uri: config.redirectURI
        });

      await redis.set(`api:token:${userToken}`, JSON.stringify({
        accessToken: body.access_token,
        refreshToken: body.refresh_token,
        expiresAt: Date.now() + (body.expires_in * 1000)
      }));

      return body.access_token;
    } catch (err) {
      console.log('invalid refresh token', err);
      await redis.del(`api:token:${userToken}`);

      throw new Error('Invalid refresh token');
    }
  } else {
    return token.accessToken;
  }
}

/*
    Make a request with the users access token.
  */
async function request (userToken, path) {
  let accessToken = config.token;
  if (userToken) accessToken = await getAccessToken(userToken);

  const cachedResponse = await redis.get(`cache:${accessToken}:${path}`);
  if (cachedResponse) return JSON.parse(cachedResponse);

  const { body } = await superagent.get(`https://discord.com/api/v10/${path}`)
    .set('Authorization', userToken ? `Bearer ${accessToken}` : `Bot ${accessToken}`);

  await redis.set(`cache:${accessToken}:${path}`, JSON.stringify(body), 'PX', 1000 * 60 * 1);

  return body;
}

async function botRequest (method = 'get', path, data = {}) {
  let body;
  try {
    let res = superagent[method](`https://discord.com/api/v10/${path}`)
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bot ${config.token}`);

    // Only send the body if its a POST
    if (method === 'post') res = await res.send(data);
    else res = await res;

    body = res.body;
  } catch (err) {
    console.error(method.toUpperCase(), path, JSON.stringify(data));
    throw err;
  }

  return body;
}

module.exports = { generateUserToken, getActivitiesAccessToken, request, botRequest };
