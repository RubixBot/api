const { authorise, findGuild } = require('../../../modules/OAuth');

module.exports = class GuildsRoute {

  // GET /guilds/:id (return a specific guild)
  async get (req, res) {
    let guild = await findGuild(req.app, req.authInfo, req.params.id);
    if (guild.code) {
      res.status(guild.code).json(Object.assign(guild, { code: undefined }));
      return;
    }

    if (!(((guild.permissions & 1) << 3) || ((guild.permissions & 1) << 5))) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.status(200).json(guild);
  }

  // Middleware
  getMiddleware (req, res, next) { return authorise(req, res, next); }

};
