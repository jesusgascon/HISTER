// Catalog helpers are kept separate from the UI so the data can be validated
// and reused by tests without booting the browser app.
(function (global) {
    'use strict';

    function getSongKey(song) {
        return [song.year, song.album, song.title].join('||');
    }

    function getSongKeyFromStoredValue(songs, value) {
        if (!value) return null;
        if (value.indexOf('||') !== -1) return value;
        for (var i = 0; i < songs.length; i++) {
            if (songs[i].audioUrl === value) return getSongKey(songs[i]);
        }
        return null;
    }

    function getSongByKey(songs, songKey) {
        for (var i = 0; i < songs.length; i++) {
            if (getSongKey(songs[i]) === songKey) return songs[i];
        }
        return null;
    }

    function getSongNumber(songs, song) {
        return songs.indexOf(song) + 1;
    }

    function getSongByNumber(songs, number) {
        var index = parseInt(number, 10) - 1;
        if (isNaN(index) || index < 0 || index >= songs.length) return null;
        return songs[index];
    }

    function formatSongNumber(number) {
        return String(number).padStart(3, '0');
    }

    function filterByEra(songs, eraValue) {
        if (!eraValue || eraValue === 'all') return songs.slice();
        var parts = eraValue.split('-');
        var from = parseInt(parts[0], 10);
        var to = parseInt(parts[1], 10);
        return songs.filter(function (song) {
            return song.year >= from && song.year <= to;
        });
    }

    function getDifficulty(song) {
        return song.difficulty || 'deep';
    }

    function filterByDifficulty(songs, difficulty) {
        if (!difficulty || difficulty === 'all') return songs.slice();
        return songs.filter(function(song) {
            var kind = getDifficulty(song);
            if (difficulty === 'hard') return kind === 'deep' || kind === 'instrumental';
            return kind === difficulty;
        });
    }

    function getAlbums(songs) {
        var seen = {};
        var albums = [];
        songs.forEach(function(song) {
            if (seen[song.album]) return;
            seen[song.album] = true;
            albums.push(song.album);
        });
        return albums;
    }

    function filterByAlbum(songs, album) {
        if (!album || album === 'all') return songs.slice();
        return songs.filter(function(song) {
            return song.album === album;
        });
    }

    function parseCardList(value, max) {
        var numbers = [];
        var seen = {};
        if (!value) return numbers;

        value.split(',').forEach(function(part) {
            var trimmed = part.trim();
            if (!trimmed) return;
            var range = trimmed.split('-');
            var from = parseInt(range[0], 10);
            var to = range.length > 1 ? parseInt(range[1], 10) : from;
            if (isNaN(from) || isNaN(to)) return;
            if (from > to) {
                var tmp = from;
                from = to;
                to = tmp;
            }
            for (var i = from; i <= to; i++) {
                if (i < 1 || i > max || seen[i]) continue;
                seen[i] = true;
                numbers.push(i);
            }
        });

        return numbers;
    }

    function filterByCardNumbers(songs, allSongs, cardNumbers) {
        if (!cardNumbers || !cardNumbers.length) return songs.slice();
        var wantedKeys = {};
        cardNumbers.forEach(function(number) {
            var song = getSongByNumber(allSongs, number);
            if (song) wantedKeys[getSongKey(song)] = true;
        });
        return songs.filter(function(song) {
            return !!wantedKeys[getSongKey(song)];
        });
    }

    function validateCatalog(songs) {
        var errors = [];
        var songKeys = {};
        var urls = {};

        if (!Array.isArray(songs) || !songs.length) {
            return ['El catálogo está vacío o no es un array.'];
        }

        songs.forEach(function (song, index) {
            var prefix = 'Canción #' + (index + 1) + ': ';
            if (!song.title) errors.push(prefix + 'falta title.');
            if (!Number.isInteger(song.year)) errors.push(prefix + 'year debe ser entero.');
            if (!song.album) errors.push(prefix + 'falta album.');
            if (!song.difficulty) errors.push(prefix + 'falta difficulty.');
            if (song.difficulty && !/^(hits|deep|instrumental)$/.test(song.difficulty)) {
                errors.push(prefix + 'difficulty debe ser hits, deep o instrumental.');
            }
            if (!song.audioUrl) errors.push(prefix + 'falta audioUrl.');
            if (song.audioUrl && !/^https:\/\/audio-ssl\.itunes\.apple\.com\//.test(song.audioUrl)) {
                errors.push(prefix + 'audioUrl no apunta al dominio esperado de Apple/iTunes.');
            }

            var key = getSongKey(song);
            if (songKeys[key]) errors.push(prefix + 'clave duplicada: ' + key);
            songKeys[key] = true;

            if (song.audioUrl) {
                if (urls[song.audioUrl]) errors.push(prefix + 'audioUrl duplicada.');
                urls[song.audioUrl] = true;
            }
        });

        return errors;
    }

    global.HisterCatalog = {
        getSongKey: getSongKey,
        getSongKeyFromStoredValue: getSongKeyFromStoredValue,
        getSongByKey: getSongByKey,
        getSongNumber: getSongNumber,
        getSongByNumber: getSongByNumber,
        formatSongNumber: formatSongNumber,
        filterByEra: filterByEra,
        filterByDifficulty: filterByDifficulty,
        getDifficulty: getDifficulty,
        getAlbums: getAlbums,
        filterByAlbum: filterByAlbum,
        parseCardList: parseCardList,
        filterByCardNumbers: filterByCardNumbers,
        validateCatalog: validateCatalog
    };
}(window));
