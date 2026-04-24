const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const dataCode = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
const catalogCode = fs.readFileSync(path.join(root, 'js/catalog.js'), 'utf8');
const context = { window: {} };

vm.createContext(context);
vm.runInContext(catalogCode, context, { filename: 'js/catalog.js' });
vm.runInContext(`${dataCode}; window.queenSongs = queenSongs;`, context, { filename: 'data.js' });

const songs = context.window.queenSongs;
const errors = context.window.HisterCatalog.validateCatalog(songs);

if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}

const urls = new Set(songs.map((song) => song.audioUrl));
console.log(`Catalog OK: ${songs.length} songs, ${urls.size} unique preview URLs.`);
