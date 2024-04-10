// Imports
const express = require('express');
const oauth = require('../../modules/oauth2');

const router = express.Router({ mergeParams: true }); // eslint-disable-line new-cap

router.post('/:channelID/:messageID', async (req, res) => {
  let settings = await req.app.locals.db.getGuildSettings(req.params.id);
  console.log(req.body);

  // Check message exists
  try {
    await oauth.botRequest('get', `channels/${req.params.channelID}/messages/${req.params.messageID}`);
  } catch (e) {
    res.status(400).json({ error: 'Could not find the message in the channel' });
    return;
  }

  // Try react with the emoji
  try {
    req.body.roles.forEach(async ({ emoji }, i) => {
      setTimeout(async () => {
        await oauth.botRequest('put', encodeURIComponent(`channels/${req.params.channelID}/messages/${req.params.messageID}/reactions/${emoji}/@me`));
      }, i * 1000);
    });
  } catch (e) {
    res.status(400).json({ error: 'Could not add emoji to message, ensure I have the Add Reactions permission' });
    return;
  }

  // Insert into the database
  const menus = settings.reaction_roles || {};
  if (menus[req.params.channelID] && menus[req.params.channelID][req.params.messageID]) {
    req.body.roles.forEach(role => {
      menus[req.params.channelID][req.params.messageID][role.emoji] = role.roleID;
    });
  } else if (menus[req.params.channelID]) {
    menus[req.params.channelID][req.params.messageID] = {};
    req.body.roles.forEach(role => {
      menus[req.params.channelID][req.params.messageID][role.emoji] = role.roleID;
    });
  } else {
    menus[req.params.channelID] = {
      [req.params.messageID]: {}
    };

    req.body.roles.forEach(role => {
      menus[req.params.channelID][req.params.messageID][role.emoji] = role.roleID;
    });
  }

  await req.app.locals.db.updateGuildSettings(req.params.id, { reaction_roles: menus });
  res.status(200).json({ ok: true });
});

router.delete('/:channelID/:messageID', async (req, res) => {
  const db = req.app.locals.db;
  let settings = await db.getGuildSettings(req.params.id);

  // Find the reaction menu and remove it
  if (settings.reaction_roles && settings.reaction_roles[req.params.channelID] && settings.reaction_roles[req.params.channelID][req.params.messageID]) {
    delete settings.reaction_roles[req.params.channelID][req.params.messageID];
    if (Object.values(settings.reaction_roles[req.params.channelID]).filter(f => f).length < 1) {
      delete settings.reaction_roles[req.params.channelID];
    }
    await db.updateGuildSettings(req.params.id, { reaction_roles: settings.reaction_roles });
  }

  // Remove all the reactions from the message
  try {
    await oauth.botRequest('delete', `channels/${req.params.channelID}/messages/${req.params.messageID}/reactions`);
  } catch (e) {} // eslint-disable-line no-empty

  res.status(200).json({ ok: true });
});

module.exports = () => router;
