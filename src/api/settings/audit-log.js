const express = require('express');
const ratelimit = require('../../middleware/ratelimits');

const router = express.Router({ mergeParams: true });

router.put('/', ratelimit({ max: 4, window: 5000 }), async (req, res) => {
  const db = req.app.locals.db;
  await db.updateGuildSettings(req.params.id, { audit_log_channel: req.body.channelID });

  return res.status(200).json({ ok: true });
});

module.exports = () => router;
