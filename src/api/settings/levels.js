const express = require('express');
const ratelimit = require('../../middleware/ratelimits');
const oauth = require('../../modules/oauth2');

const router = express.Router({ mergeParams: true });

router.get('/', ratelimit({ max: 4, window: 5000 }), async (req, res) => {
  const db = req.app.locals.db;
  const members = await oauth.botRequest('get', `guilds/${req.params.id}/members`);
  const leaderboard = await db.getGuildLeaderboard(req.params.id);

  return res.status(200).json(leaderboard.filter(lb => members.find(m => m.user.id === lb.user_id)).map((lb) => {
    const member = members.find((m) => m.user.id === lb.user_id);
    if (!member) console.log(member, lb);
    const level = db.getLevelFromXP(lb.experience);

    return {
      username: member.user.global_name || member.user.username,
      level,
      xp: lb.experience,
      levelXP: db.getLevelXP(level),
      xpRemaining: db.getRemainingXP(level, lb.experience)
    };
  }));
});

module.exports = () => router;
