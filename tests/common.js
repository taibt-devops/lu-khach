// Shared paths for the Playwright scripts: the game is opened straight from this checkout (file://).
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const GAME = path.join(__dirname, '..', 'game', 'index.html');
const SHOTS = path.join(__dirname, '..', 'build', 'test-shots');   // build/ is gitignored
fs.mkdirSync(SHOTS, { recursive: true });

module.exports = {
  /** file:// URL of game/index.html, e.g. url('?speed=4') to run the game 4x faster. */
  url: (query = '') => pathToFileURL(GAME).href + query,
  SHOTS,
  /** Chrome installed on the machine; no Playwright browser download needed. */
  launch: { channel: 'chrome', args: ['--autoplay-policy=no-user-gesture-required'] },
};
