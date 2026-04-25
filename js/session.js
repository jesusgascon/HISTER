(function (global) {
    'use strict';

    function cleanText(value, fallback, maxLength) {
        var text = typeof value === 'string' ? value : fallback;
        text = String(text || fallback || '').replace(/[\u0000-\u001f\u007f]/g, '').trim();
        return text.slice(0, maxLength || 80);
    }

    function normalizeRules(rules) {
        var allowedYears = { exact: true, 'margin-1': true, 'margin-2': true, timeline: true, off: true };
        rules = rules || {};
        return {
            year: allowedYears[rules.year] ? rules.year : 'exact',
            title: typeof rules.title === 'boolean' ? rules.title : true,
            album: typeof rules.album === 'boolean' ? rules.album : true
        };
    }

    function normalizePlaylist(settings) {
        var allowedDifficulty = { all: true, hits: true, deep: true, instrumental: true, hard: true };
        var allowedSize = { all: true, '20': true, '40': true, '60': true };
        settings = settings || {};
        return {
            difficulty: allowedDifficulty[settings.difficulty] ? settings.difficulty : 'all',
            album: cleanText(settings.album, 'all', 120),
            size: allowedSize[String(settings.size)] ? String(settings.size) : 'all',
            manualCards: cleanText(settings.manualCards, '', 300)
        };
    }

    function normalizeTeams(teams) {
        if (!Array.isArray(teams)) return [];
        return teams.slice(0, 12).map(function(team, index) {
            var score = Number(team && team.score);
            return {
                id: cleanText(team && team.id, 'team-import-' + index, 80),
                name: cleanText(team && team.name, 'Equipo ' + (index + 1), 60),
                score: Number.isFinite(score) ? Math.max(-999, Math.min(9999, Math.round(score))) : 0
            };
        }).filter(function(team) {
            return !!team.name;
        });
    }

    function normalizeSongKeys(values, validKeys) {
        if (!Array.isArray(values)) return [];
        var seen = {};
        var output = [];
        values.forEach(function(value) {
            if (typeof value !== 'string' || !validKeys[value] || seen[value]) return;
            seen[value] = true;
            output.push(value);
        });
        return output;
    }

    function normalizeHistory(values, validSongsByKey) {
        if (!Array.isArray(values)) return [];
        var seen = {};
        var output = [];
        values.forEach(function(item) {
            var key = item && item.songKey;
            var song = validSongsByKey[key];
            if (!song || seen[key]) return;
            seen[key] = true;
            output.push({
                songKey: key,
                title: song.title,
                year: song.year,
                album: song.album
            });
        });
        return output;
    }

    function normalizeScoreHistory(values, teams) {
        if (!Array.isArray(values)) return [];
        var teamIds = {};
        teams.forEach(function(team) {
            teamIds[team.id] = true;
        });

        return values.slice(0, 30).map(function(item) {
            var delta = Number(item && item.delta);
            var previousScore = Number(item && item.previousScore);
            var nextScore = Number(item && item.nextScore);
            var teamId = cleanText(item && item.teamId, '', 80);
            if (!teamIds[teamId] || !Number.isFinite(delta) || !Number.isFinite(previousScore) || !Number.isFinite(nextScore)) {
                return null;
            }
            return {
                teamId: teamId,
                teamName: cleanText(item && item.teamName, 'Equipo', 60),
                label: cleanText(item && item.label, 'Puntos', 40),
                delta: Math.max(-999, Math.min(999, Math.round(delta))),
                previousScore: Math.max(-999, Math.min(9999, Math.round(previousScore))),
                nextScore: Math.max(-999, Math.min(9999, Math.round(nextScore))),
                category: cleanText(item && item.category, '', 20),
                cardKey: cleanText(item && item.cardKey, '', 220)
            };
        }).filter(Boolean);
    }

    function normalizeImportedPayload(payload, allSongs) {
        payload = payload || {};
        var validKeys = {};
        var validSongsByKey = {};
        allSongs.forEach(function(song) {
            var key = global.HisterCatalog.getSongKey(song);
            validKeys[key] = true;
            validSongsByKey[key] = song;
        });

        var teams = normalizeTeams(payload.teams);
        var activeTeamId = cleanText(payload.activeTeamId, '', 80);
        if (!teams.some(function(team) { return team.id === activeTeamId; })) {
            activeTeamId = teams[0] ? teams[0].id : null;
        }

        return {
            playedSongKeys: normalizeSongKeys(payload.playedSongKeys, validKeys),
            failedSongKeys: normalizeSongKeys(payload.failedSongKeys, validKeys),
            playedHistory: normalizeHistory(payload.playedHistory, validSongsByKey),
            filter: cleanText(payload.filter, 'all', 40),
            completedFilter: typeof payload.completedFilter === 'string' ? payload.completedFilter : null,
            rules: normalizeRules(payload.rules),
            playlist: normalizePlaylist(payload.playlist),
            playlistSeed: cleanText(payload.playlistSeed, '', 80),
            presenterMode: typeof payload.presenterMode === 'boolean' ? payload.presenterMode : false,
            teams: teams,
            activeTeamId: activeTeamId,
            scoreHistory: normalizeScoreHistory(payload.scoreHistory, teams)
        };
    }

    global.HisterSession = {
        cleanText: cleanText,
        normalizeRules: normalizeRules,
        normalizePlaylist: normalizePlaylist,
        normalizeTeams: normalizeTeams,
        normalizeScoreHistory: normalizeScoreHistory,
        normalizeImportedPayload: normalizeImportedPayload
    };
}(window));
