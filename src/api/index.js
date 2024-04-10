const router = require('express').Router();

// Routes
const activities = require('./activites');
const oauth2 = require('./oauth2');
const settings = require('./settings');
const customCommands = require('./custom-commands');

// Use routes
router.use('/activities', activities());
router.use('/oauth2', oauth2());
router.use('/settings', settings());
router.use('/custom-commands', customCommands());

// 404
router.all('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = () => router;
