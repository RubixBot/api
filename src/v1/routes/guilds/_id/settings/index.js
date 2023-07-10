const { authorise, findGuild } = require('../../../modules/OAuth');

module.exports = class GuildSettings {

  // GET /guilds/:id/settings (return a specific guild settings)
  async get (req, res) {
    let guild = await findGuild(req.app, req.authInfo, req.params.id);
    if (guild.code) {
      res.status(guild.code).json(Object.assign(guild, { code: undefined }));
      return;
    }

    if (!(((guild.permissions & 1) << 3) || ((guild.permissions & 1) << 5))) {
      res.status(401).json({ error: 'Unauthorised' });
      return;
    }

    const settings = await req.app.locals.db.getGuildSettings(guild.id);
    res.status(200).json(settings);
  }

  // POST /guilds:id/settings (sets the guilds settings)
  async post (req, res) {
    let guild = await findGuild(req.app, req.authInfo, req.params.id);
    if (guild.code) {
      res.status(guild.code).json(Object.assign(guild, { code: undefined }));
      return;
    }

    if (!(((guild.permissions & 1) << 3) || ((guild.permissions & 1) << 5))) {
      res.status(401).json({ error: 'Unauthorised' });
      return;
    }

    await req.app.locals.db.updateGuildSettings(guild.id, req.body);
    res.status(200).json({ success: true });
  }

  // Middleware
  getMiddleware (req, res, next) { return authorise(req, res, next); }
  postMiddleware (req, res, next) { return authorise(req, res, next); }

};
