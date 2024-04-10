// Imports
const express = require('express');
const oauth = require('../modules/oauth2');

const router = express.Router(); // eslint-disable-line new-cap

// Middleware
router.post('/token', async (req, res) => {
  console.log(req.body);
  const access_token = await oauth.getActivitiesAccessToken(req.body.code);

  res.send({ access_token });
});

router.get('/', (req, res) => {
  res.sendFile(`${__dirname}/activities/index.html`);
});

module.exports = () => router;
