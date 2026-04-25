(function (global) {
    'use strict';

    function createSeed() {
        return String(Date.now()) + '-' + String(Math.floor(Math.random() * 1000000));
    }

    function hashString(value) {
        var hash = 2166136261;
        var text = String(value || '');
        for (var i = 0; i < text.length; i++) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function seededRandom(seed) {
        var state = hashString(seed) || 1;
        return function () {
            state = Math.imul(state ^ (state >>> 15), 1 | state);
            state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
            return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
        };
    }

    function shuffle(songs, seed) {
        var output = songs.slice();
        var random = seededRandom(seed);
        for (var i = output.length - 1; i > 0; i--) {
            var j = Math.floor(random() * (i + 1));
            var tmp = output[i];
            output[i] = output[j];
            output[j] = tmp;
        }
        return output;
    }

    function applySize(songs, size, seed) {
        if (!size || size === 'all') return songs.slice();
        var limit = parseInt(size, 10);
        if (isNaN(limit) || limit <= 0) return songs.slice();
        return shuffle(songs, seed).slice(0, limit);
    }

    function buildPool(allSongs, eraValue, settings, seed) {
        var catalog = global.HisterCatalog;
        var manualCards = catalog.parseCardList(settings.manualCards, allSongs.length);

        if (manualCards.length) {
            return {
                songs: manualCards.map(function (number) {
                    return catalog.getSongByNumber(allSongs, number);
                }).filter(Boolean),
                manualCount: manualCards.length,
                manualMode: true
            };
        }

        var pool = catalog.filterByEra(allSongs, eraValue);
        pool = catalog.filterByDifficulty(pool, settings.difficulty);
        pool = catalog.filterByAlbum(pool, settings.album);
        pool = applySize(pool, settings.size, seed);

        return {
            songs: pool,
            manualCount: 0,
            manualMode: false
        };
    }

    global.HisterPlaylist = {
        createSeed: createSeed,
        buildPool: buildPool,
        shuffle: shuffle
    };
}(window));
