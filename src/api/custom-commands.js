// Imports
const config = require(`../../config${process.env.PROD === 'true' ? '' : '.dev'}.json`);
const express = require('express');
const oauth = require('../modules/oauth2');

const router = express.Router(); // eslint-disable-line new-cap

// Middleware
router.use('/:id(\\d+)', async (req, res, next) => {
  const auth = req.get('authorization');
  if (!auth) return res.status(401).json({ error: 'No Authorization header' });

  try {
    const guilds = await oauth.request(auth, 'users/@me/guilds');
    const guild = guilds.find(({ id }) => id === req.params.id);

    if (!guild) {
      return res.status(400).json({ error: 'User is not in server' });
    } else if (!guild.owner && !(guild.permissions & 32)) {
      return res.status(403).json({ error: 'User does not have permissions' });
    }

    req.guild = guild;
    return next();
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    } else {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
});

router.get('/:id(\\d+)', async (req, res) => {
  const customCommands = await req.app.locals.db.getCustomCommands(req.params.id);

  res.status(200).json(customCommands);
});

router.post('/:id(\\d+)', async (req, res) => {
  const db = req.app.locals.db;
  if (!req.body.name || !req.body.message) {
    res.status(400).send({ error: '"name" and "message" is a required value.' });
    return;
  }
  if (req.body.name.length > 32) {
    res.status(400).send({ error: '"name" cannot be more than 32 characters.' });
    return;
  }

  // core command
  const alreadyExists = await db.getCustomCommand(req.params.id, req.body.name);
  if (alreadyExists) {
    res.status(400).json({ error: `"${req.body.name}" is already a custom command in this server.` });
    return;
  }
  // premium

  // Get the users name
  const { username } = await oauth.request(req.get('authorization'), 'users/@me');

  // Create the custom command & add it into the database
  await oauth.botRequest('post', `applications/${config.applicationID}/guilds/${req.params.id}/commands`, {
    name: req.body.name,
    description: `Custom command by ${username}`,
    options: [{
      name: 'args',
      type: 3,
      required: false,
      description: 'Arguments to pass to the command'
    }]
  });
  await db.createCustomCommand(req.params.id, req.body.name, username, req.body.message);
  res.status(200).json({ ok: true });
});

router.delete('/:id(\\d+)/:name', async (req, res) => {
  const db = req.app.locals.db;
  await db.deleteCustomCommand(req.params.id, req.params.name);

  // Get all guild commands & find the command name
  const guildCommands = await oauth.botRequest('get', `applications/${config.applicationID}/guilds/${req.params.id}/commands`);
  const customCommand = guildCommands.find((command) => command.name === req.params.name.toLowerCase());

  // Delete the custom command if it exists.
  if (customCommand) {
    await oauth.botRequest('delete', `applications/${config.applicationID}/guilds/${req.params.id}/commands/${customCommand.id}`);
  }

  res.status(200).json({ ok: true });
});
module.exports = () => router;
