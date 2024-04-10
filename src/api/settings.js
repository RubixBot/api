// Imports
const express = require('express');
const oauth = require('../modules/oauth2');
const ratelimit = require('../middleware/ratelimits');

const router = express.Router(); // eslint-disable-line new-cap

const auditLog = require('./settings/audit-log');
const levels = require('./settings/levels');
const levelling = require('./settings/levelling');
const reactions = require('./settings/reaction-roles');

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

// Setting routes
router.use('/:id(\\d+)/audit-log', auditLog());
router.use('/:id(\\d+)/levels', levels());
router.use('/:id(\\d+)/levelling', levelling());
router.use('/:id(\\d+)/reaction-roles', reactions());

// Get guild settings
router.get('/:id(\\d+)', ratelimit({ max: 4, window: 5000 }), async (req, res) => {
  const guild = req.guild;
  const guildChannels = await oauth.request(null, `guilds/${req.params.id}/channels`);
  const guildSettings = await req.app.locals.db.getGuildSettings(req.params.id);

  return res.status(200).json(Object.assign(guild, { settings: guildSettings, channels: guildChannels }));
});

// Get guild roles
router.get('/:id(\\d+)/roles', ratelimit({ max: 4, window: 5000 }), async (req, res) => {
  const roles = await oauth.request(null, `guilds/${req.params.id}/roles`);

  return res.status(200).json(roles);
});

module.exports = () => router;
