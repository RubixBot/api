const express = require('express');
const ratelimit = require('../../middleware/ratelimits');

const router = express.Router({ mergeParams: true });

router.put('/', ratelimit({ max: 4, window: 5000 }), async (req, res) => {
  const db = req.app.locals.db;

  if (!req.body.levelling_enabled) {
    await db.updateGuildSettings(req.params.id, {
      levelling_enabled: false,
      min_xp: null,
      max_xp: null,
      xp_cooldown: null,
      levelup_msg: null,
      custom_levelup: null,
      level_roles: []
    });
  } else {
    await db.updateGuildSettings(req.params.id, {
      levelling_enabled: true,
      min_xp: req.body.min_xp,
      max_xp: req.body.max_xp,
      xp_cooldown: req.body.xp_cooldown,
      levelup_msg: req.body.levelup_msg,
      custom_levelup: req.body.custom_levelup,
      level_roles: req.body.level_roles
    });
  }

  return res.status(200).json({ ok: true });
});

module.exports = () => router;
