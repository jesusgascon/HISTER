// ============================================================
//  HITSTER QUEEN EDITION - app.js
// ============================================================

window.onload = function () {

    // ── 1. Comprobar datos ────────────────────────────────────
    if (typeof queenSongs === 'undefined' || !queenSongs.length) {
        console.error('queenSongs no cargado.');
        return;
    }
    var catalogErrors = HisterCatalog.validateCatalog(queenSongs);
    if (catalogErrors.length) {
        console.error('Catálogo inválido:', catalogErrors);
        return;
    }

    // ── 2. Fondo aleatorio ────────────────────────────────────
    var backgroundImages = ['queen_concert_bg.jpg', 'queen_concert_bg_alt.jpg'];
    var selectedBackground = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    document.body.style.backgroundImage = "url('" + selectedBackground + "')";

    // ── 3. Referencias DOM ────────────────────────────────────
    var btnPlay        = document.getElementById('btn-play');
    var btnFlip        = document.getElementById('btn-flip');
    var btnPrint       = document.getElementById('btn-print');
    var dashAudio      = document.getElementById('audio-dashboard');
    var audio          = document.getElementById('native-audio');
    var btnPause       = document.getElementById('btn-audio-pause');
    var btnResume      = document.getElementById('btn-audio-resume');
    var btnRestart     = document.getElementById('btn-audio-restart');
    var statusEl       = document.getElementById('audio-status');
    var emptyState     = document.getElementById('empty-state');
    var cardContainer  = document.getElementById('game-card-container');
    var activeCard     = document.getElementById('active-card');
    var qrBox          = document.getElementById('game-qr-code');
    var ansYear        = document.getElementById('ans-year');
    var ansTitle       = document.getElementById('ans-title');
    var ansAlbum       = document.getElementById('ans-album');
    var navGame        = document.getElementById('nav-game');
    var navCards       = document.getElementById('nav-cards');
    var screenGame     = document.getElementById('screen-game');
    var screenCards    = document.getElementById('screen-cards');
    var countEl        = document.getElementById('total-songs-count');
    var countEl2       = document.getElementById('total-songs-count-2');
    var progressBar    = document.getElementById('audio-progress-bar');
    var progressFill   = document.getElementById('audio-progress-fill');
    var statsPlayed    = document.getElementById('stat-played');
    var statsRemaining = document.getElementById('stat-remaining');
    var btnReset       = document.getElementById('btn-reset-session');
    var btnBackMenu    = document.getElementById('btn-back-menu');
    var filterSelect   = document.getElementById('filter-era');
    var activeEraBadge = document.getElementById('active-era-badge');
    var historyList    = document.getElementById('played-history');
    var historyCount   = document.getElementById('history-count');
    var ruleYear       = document.getElementById('rule-year');
    var ruleTitle      = document.getElementById('rule-title');
    var ruleAlbum      = document.getElementById('rule-album');
    var rulesSummary   = document.getElementById('rules-summary');
    var difficultySelect = document.getElementById('filter-difficulty');
    var albumSelect    = document.getElementById('filter-album');
    var playlistSizeSelect = document.getElementById('playlist-size');
    var manualCardList = document.getElementById('manual-card-list');
    var playlistSummary = document.getElementById('playlist-summary');
    var cardNumberInput = document.getElementById('printed-card-number');
    var btnPlayCardNumber = document.getElementById('btn-play-card-number');
    var cardLookupStatus = document.getElementById('card-lookup-status');
    var activeCardNumber = document.getElementById('active-card-number');
    var btnCheckPreviews = document.getElementById('btn-check-previews');
    var previewCheckStatus = document.getElementById('preview-check-status');
    var previewCheckResults = document.getElementById('preview-check-results');
    var presenterMode = document.getElementById('presenter-mode');
    var btnExportSession = document.getElementById('btn-export-session');
    var importSessionFile = document.getElementById('import-session-file');
    var sessionIoStatus = document.getElementById('session-io-status');
    var teamNameInput = document.getElementById('team-name-input');
    var btnAddTeam = document.getElementById('btn-add-team');
    var scoreboardList = document.getElementById('scoreboard-list');
    var activeTeamLabel = document.getElementById('active-team-label');
    var btnScoreYear = document.getElementById('btn-score-year');
    var btnScoreTitle = document.getElementById('btn-score-title');
    var btnScoreAlbum = document.getElementById('btn-score-album');
    var btnScorePlusOne = document.getElementById('btn-score-plus-one');
    var btnScoreMinusOne = document.getElementById('btn-score-minus-one');
    var cardTitleEl    = activeCard ? activeCard.querySelector('.card-title') : null;
    var scanTextEl     = activeCard ? activeCard.querySelector('.scan-text') : null;
    var backTitleEl    = activeCard ? activeCard.querySelector('.back-title') : null;
    var answerLabels   = activeCard ? activeCard.querySelectorAll('.answer-label') : [];
    var audioControls  = document.querySelector('.audio-controls');

    // ── 4. Estado (con almacenamiento local) ─────────────────
    var currentSong    = null;
    var cardsGenerated = false;
    var playedSongKeys = new Set();
    var failedSongKeys = new Set();
    var progressTimer  = null;
    var audioLoadTimer = null;
    var filteredPool   = [];
    var playedHistory  = [];
    var currentSongRevealed = false;
    var gameCompleted  = false;
    var suppressAudioAbort = false;
    var completedFilter = null;
    var teams = [];
    var activeTeamId = null;
    var qrRenderer = HisterQrRenderer.create({
        setStatus: setStatus,
        isGameCompleted: function () { return gameCompleted; }
    });

    function getSongKeyFromStoredValue(value) {
        return HisterCatalog.getSongKeyFromStoredValue(queenSongs, value);
    }

    function getSongByKey(songKey) {
        return HisterCatalog.getSongByKey(queenSongs, songKey);
    }

    populateAlbumFilter();

    // Cargar progreso previo
    try {
        var savedData = localStorage.getItem('hister_queen_played');
        if (savedData) {
            var arr = JSON.parse(savedData);
            arr.forEach(function(value) {
                var songKey = getSongKeyFromStoredValue(value);
                if (songKey) playedSongKeys.add(songKey);
            });
        }
        var savedHistory = localStorage.getItem('hister_queen_history');
        if (savedHistory) {
            var seenHistoryKeys = new Set();
            playedHistory = JSON.parse(savedHistory).map(function(item) {
                if (!item) return null;
                var songKey = item.songKey || getSongKeyFromStoredValue(item.audioUrl);
                var song = songKey ? getSongByKey(songKey) : null;
                if (!song && item.title && item.album && item.year) {
                    songKey = [item.year, item.album, item.title].join('||');
                    song = getSongByKey(songKey);
                }
                if (!song || seenHistoryKeys.has(songKey)) return null;
                seenHistoryKeys.add(songKey);
                return {
                    songKey: songKey,
                    title: song.title,
                    year: song.year,
                    album: song.album
                };
            });
            playedHistory = playedHistory.filter(Boolean);
        }
        var savedFilter = localStorage.getItem('hister_queen_filter');
        if (savedFilter && filterSelect) {
            filterSelect.value = savedFilter;
        }
        var savedCompletedFilter = localStorage.getItem('hister_queen_completed_filter');
        if (savedCompletedFilter) {
            completedFilter = savedCompletedFilter;
        }
        var savedRules = localStorage.getItem('hister_queen_rules');
        if (savedRules) {
            applyRules(JSON.parse(savedRules));
        }
        var savedPlaylist = localStorage.getItem('hister_queen_playlist');
        if (savedPlaylist) {
            applyPlaylistSettings(JSON.parse(savedPlaylist));
        }
        var savedTeams = localStorage.getItem('hister_queen_teams');
        if (savedTeams) {
            var parsedTeams = JSON.parse(savedTeams);
            teams = Array.isArray(parsedTeams.teams) ? parsedTeams.teams : [];
            activeTeamId = parsedTeams.activeTeamId || (teams[0] && teams[0].id) || null;
        }
        var savedPresenter = localStorage.getItem('hister_queen_presenter_mode');
        if (presenterMode && savedPresenter) {
            presenterMode.checked = savedPresenter === 'true';
        }
    } catch (e) {
        console.log('No se pudo cargar progreso anterior.', e);
    }

    function saveProgress() {
        try {
            var arr = Array.from(playedSongKeys);
            localStorage.setItem('hister_queen_played', JSON.stringify(arr));
            localStorage.setItem('hister_queen_history', JSON.stringify(playedHistory));
            if (filterSelect) {
                localStorage.setItem('hister_queen_filter', filterSelect.value);
            }
            if (completedFilter) {
                localStorage.setItem('hister_queen_completed_filter', completedFilter);
            } else {
                localStorage.removeItem('hister_queen_completed_filter');
            }
            localStorage.setItem('hister_queen_rules', JSON.stringify(getRules()));
            localStorage.setItem('hister_queen_playlist', JSON.stringify(getPlaylistSettings()));
            localStorage.setItem('hister_queen_teams', JSON.stringify({ teams: teams, activeTeamId: activeTeamId }));
            if (presenterMode) {
                localStorage.setItem('hister_queen_presenter_mode', String(presenterMode.checked));
            }
        } catch (e) {}
    }

    function getRules() {
        return {
            year: ruleYear ? ruleYear.value : 'exact',
            title: ruleTitle ? ruleTitle.checked : true,
            album: ruleAlbum ? ruleAlbum.checked : true
        };
    }

    function applyRules(rules) {
        if (!rules) return;
        if (ruleYear && rules.year) ruleYear.value = rules.year;
        if (ruleTitle && typeof rules.title === 'boolean') ruleTitle.checked = rules.title;
        if (ruleAlbum && typeof rules.album === 'boolean') ruleAlbum.checked = rules.album;
    }

    function getRulesText() {
        var rules = getRules();
        var parts = [];
        if (rules.year === 'exact') parts.push('Año exacto: 3 puntos');
        if (rules.year === 'margin-1') parts.push('Año ±1: 2 puntos');
        if (rules.year === 'margin-2') parts.push('Año ±2: 1 punto');
        if (rules.year === 'timeline') parts.push('Solo ordenar cronológicamente');
        if (rules.year === 'off') parts.push('Año sin puntuar');
        if (rules.title) parts.push('Título: 2 puntos');
        if (rules.album) parts.push('Álbum: 1 punto');
        return parts.join(' · ');
    }

    function renderRules() {
        if (rulesSummary) rulesSummary.textContent = getRulesText();
        saveProgress();
    }

    function getPlaylistSettings() {
        return {
            difficulty: difficultySelect ? difficultySelect.value : 'all',
            album: albumSelect ? albumSelect.value : 'all',
            size: playlistSizeSelect ? playlistSizeSelect.value : 'all',
            manualCards: manualCardList ? manualCardList.value : ''
        };
    }

    function applyPlaylistSettings(settings) {
        if (!settings) return;
        if (difficultySelect && settings.difficulty) difficultySelect.value = settings.difficulty;
        if (albumSelect && settings.album) albumSelect.value = settings.album;
        if (playlistSizeSelect && settings.size) playlistSizeSelect.value = settings.size;
        if (manualCardList && typeof settings.manualCards === 'string') manualCardList.value = settings.manualCards;
    }

    function populateAlbumFilter() {
        if (!albumSelect) return;
        var previous = albumSelect.value || 'all';
        albumSelect.innerHTML = '<option value="all">Todos los álbumes</option>';
        HisterCatalog.getAlbums(queenSongs).forEach(function(album) {
            var option = document.createElement('option');
            option.value = album;
            option.textContent = album;
            albumSelect.appendChild(option);
        });
        albumSelect.value = Array.from(albumSelect.options).some(function(option) {
            return option.value === previous;
        }) ? previous : 'all';
    }

    function renderPlaylistSummary() {
        if (!playlistSummary) return;
        var settings = getPlaylistSettings();
        var manualCount = HisterCatalog.parseCardList(settings.manualCards, queenSongs.length).length;
        var parts = [];
        if (settings.difficulty !== 'all') parts.push('Dificultad: ' + difficultySelect.options[difficultySelect.selectedIndex].text);
        if (settings.album !== 'all') parts.push('Álbum: ' + settings.album);
        if (settings.size !== 'all') parts.push(settings.size + ' cartas');
        if (manualCount) parts.push(manualCount + ' cartas manuales');
        playlistSummary.textContent = parts.length ? parts.join(' · ') : 'Usando todo el catálogo activo.';
    }

    function getActiveCatalogKey() {
        return (filterSelect ? filterSelect.value : 'all') + '::' + JSON.stringify(getPlaylistSettings());
    }

    function getYearPoints() {
        var yearRule = getRules().year;
        if (yearRule === 'exact') return 3;
        if (yearRule === 'margin-1') return 2;
        if (yearRule === 'margin-2') return 1;
        return 0;
    }

    function getScoreValue(type) {
        var rules = getRules();
        if (type === 'year') return getYearPoints();
        if (type === 'title') return rules.title ? 2 : 0;
        if (type === 'album') return rules.album ? 1 : 0;
        return 0;
    }

    function createTeam(name) {
        return {
            id: 'team-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
            name: name,
            score: 0
        };
    }

    function addTeam() {
        var name = teamNameInput ? teamNameInput.value.trim() : '';
        if (!name) return;
        var team = createTeam(name);
        teams.push(team);
        activeTeamId = team.id;
        if (teamNameInput) teamNameInput.value = '';
        renderScoreboard();
        saveProgress();
    }

    function getActiveTeam() {
        if (!teams.length) return null;
        var found = teams.find(function(team) { return team.id === activeTeamId; });
        return found || teams[0];
    }

    function updateTeamScore(delta) {
        var team = getActiveTeam();
        if (!team || !delta) return;
        team.score += delta;
        renderScoreboard();
        saveProgress();
    }

    function renderScoreboard() {
        if (!scoreboardList || !activeTeamLabel) return;
        scoreboardList.innerHTML = '';
        if (!teams.length) {
            activeTeamLabel.textContent = '—';
            var empty = document.createElement('p');
            empty.className = 'history-empty';
            empty.textContent = 'Añade equipos para empezar a puntuar.';
            scoreboardList.appendChild(empty);
            return;
        }

        if (!getActiveTeam()) activeTeamId = teams[0].id;
        activeTeamLabel.textContent = getActiveTeam().name;

        teams.slice().sort(function(a, b) {
            return b.score - a.score;
        }).forEach(function(team) {
            var row = document.createElement('button');
            row.type = 'button';
            row.className = team.id === activeTeamId ? 'team-row is-active-team' : 'team-row';
            row.innerHTML = '<span>' + team.name + '</span><strong>' + team.score + '</strong>';
            row.addEventListener('click', function() {
                activeTeamId = team.id;
                renderScoreboard();
                saveProgress();
            });
            scoreboardList.appendChild(row);
        });
    }

    // ── 5. Historial de canciones jugadas ────────────────────────
    function addToHistory(song) {
        var songKey = HisterCatalog.getSongKey(song);
        playedHistory = playedHistory.filter(function(item) {
            return item.songKey !== songKey;
        });
        playedHistory.unshift({
            songKey: songKey,
            title: song.title,
            year: song.year,
            album: song.album
        });
    }

    function revealCurrentSong() {
        if (!currentSong || currentSongRevealed) return;
        addToHistory(currentSong);
        currentSongRevealed = true;
        saveProgress();
        renderHistory();
    }

    function renderHistory() {
        if (!historyList || !historyCount) return;
        historyCount.textContent = playedHistory.length;
        historyList.innerHTML = '';

        if (!playedHistory.length) {
            var emptyItem = document.createElement('li');
            emptyItem.className = 'history-empty';
            emptyItem.textContent = 'Todavía no ha salido ninguna canción.';
            historyList.appendChild(emptyItem);
            return;
        }

        playedHistory.forEach(function(song) {
            var item = document.createElement('li');
            item.className = 'history-item';

            var main = document.createElement('span');
            main.className = 'history-song';
            main.textContent = song.title;

            var meta = document.createElement('span');
            meta.className = 'history-meta';
            meta.textContent = song.year + ' · ' + song.album;

            item.appendChild(main);
            item.appendChild(meta);
            historyList.appendChild(item);
        });
    }

    function setPlayButtonLocked(locked, text) {
        if (!btnPlay) return;
        btnPlay.disabled = !!locked;
        btnPlay.textContent = text || '🎤 SACAR NUEVA CANCIÓN';
    }

    function clearAudioLoadTimer() {
        clearTimeout(audioLoadTimer);
        audioLoadTimer = null;
    }

    function startAudioLoadTimer() {
        clearAudioLoadTimer();
        audioLoadTimer = setTimeout(function() {
            if (!currentSong || gameCompleted) return;
            resetProgressBar();
            showResume();
            setStatus('⚠️ El preview tarda demasiado en responder. Pulsa Play para reintentar o saca otra canción.', 'var(--error-red)');
        }, 8000);
    }

    function handleAudioFailure(message) {
        clearAudioLoadTimer();
        resetProgressBar();
        showResume();
        setStatus(message, 'var(--error-red)');
    }

    function getPlayedSongsInPoolCount() {
        var count = 0;
        for (var i = 0; i < filteredPool.length; i++) {
            if (playedSongKeys.has(HisterCatalog.getSongKey(filteredPool[i]))) count++;
        }
        return count;
    }

    function getFailedSongsInPoolCount() {
        var count = 0;
        for (var i = 0; i < filteredPool.length; i++) {
            if (failedSongKeys.has(HisterCatalog.getSongKey(filteredPool[i]))) count++;
        }
        return count;
    }

    function discardCurrentSongFromSession(message) {
        if (!currentSong) {
            handleAudioFailure(message);
            return;
        }

        var songKey = HisterCatalog.getSongKey(currentSong);
        failedSongKeys.add(songKey);
        playedSongKeys.delete(songKey);
        currentSongRevealed = true;
        saveProgress();
        updateStats();

        if (getAvailableSongs().length === 0) {
            showCompletionCard('unavailable');
            return;
        }

        handleAudioFailure(message + ' Esta carta se descartará durante esta sesión.');
    }

    function resetGameQrContainer() {
        qrBox = qrRenderer.resetGameQrContainer(qrBox);
    }

    function renderGameQr(url) {
        qrBox = qrRenderer.renderGameQr(qrBox, url);
    }

    function renderPrintQr(target, url) {
        qrRenderer.renderPrintQr(target, url);
    }

    function showAnswerLabels(label1, label2, label3) {
        if (!answerLabels.length) return;
        answerLabels[0].textContent = label1;
        answerLabels[1].textContent = label2;
        answerLabels[2].textContent = label3;
    }

    function showAudioControls(show) {
        var displayValue = show ? '' : 'none';
        if (audioControls) audioControls.style.display = displayValue;
        if (btnFlip) btnFlip.style.display = displayValue;
        if (!show && progressBar) progressBar.style.display = 'none';
    }

    function showSongCard(song) {
        var songNumber = HisterCatalog.getSongNumber(queenSongs, song);
        if (cardTitleEl) cardTitleEl.textContent = 'Hitster Queen';
        if (scanTextEl) {
            scanTextEl.innerHTML = songNumber > 0
                ? 'Carta #' + HisterCatalog.formatSongNumber(songNumber) + '<br>Escanea el QR o usa los controles'
                : 'Escanea el QR para escuchar<br>o usa los controles de la derecha';
        }
        if (activeCardNumber) {
            activeCardNumber.textContent = songNumber > 0
                ? 'Carta #' + HisterCatalog.formatSongNumber(songNumber)
                : 'Carta especial';
            activeCardNumber.style.display = songNumber > 0 ? 'inline-block' : 'none';
        }
        if (backTitleEl) backTitleEl.textContent = '¡Respuesta!';
        showAnswerLabels('Año de lanzamiento', 'Canción', 'Álbum');
        ansYear.textContent  = song.year;
        ansTitle.textContent = song.title;
        ansAlbum.textContent = song.album;
        emptyState.style.display = 'none';
        cardContainer.style.display = 'block';
        activeCard.classList.remove('is-flipped');
    }

    function resetToEmptyState() {
        dashAudio.style.display = 'none';
        cardContainer.style.display = 'none';
        emptyState.style.display = 'block';
        activeCard.classList.remove('is-flipped');
        resetGameQrContainer();
        currentSong = null;
        currentSongRevealed = false;
        gameCompleted = false;
        showAudioControls(true);
        setPlayButtonLocked(false, '🎤 SACAR NUEVA CANCIÓN');
        if (activeCardNumber) {
            activeCardNumber.style.display = 'none';
        }
        if (btnBackMenu) {
            btnBackMenu.style.display = 'block';
            btnBackMenu.textContent = '🏠 VOLVER AL MENÚ DE INICIO';
        }
    }

    function showCompletionCard(mode) {
        var endMode = mode || 'completed';
        var totalCompleted = filteredPool.length;
        var currentLabel = activeEraBadge ? activeEraBadge.textContent.replace('Época: ', '') : 'Catálogo actual';
        gameCompleted = true;
        completedFilter = endMode === 'completed' ? getActiveCatalogKey() : null;
        saveProgress();
        pauseAudio();
        resetProgressBar();
        currentSong = null;
        currentSongRevealed = false;
        showSongCard({
            year: currentLabel,
            title: endMode === 'completed' ? (totalCompleted + ' canciones únicas') : 'No quedan previews jugables',
            album: endMode === 'completed' ? 'Vuelve al inicio y reinicia la sesión' : 'Reinicia la sesión o prueba otro filtro'
        });
        if (cardTitleEl) cardTitleEl.textContent = endMode === 'completed' ? 'Juego Completado' : 'Sesión Interrumpida';
        if (scanTextEl) scanTextEl.innerHTML = endMode === 'completed'
            ? 'No quedan más tarjetas por sacar<br>en este catálogo.'
            : 'Los previews restantes no están disponibles<br>en este momento.';
        if (backTitleEl) backTitleEl.textContent = endMode === 'completed' ? 'Fin de la partida' : 'No se puede continuar';
        showAnswerLabels('Catálogo', 'Resultado', 'Siguiente paso');
        qrBox.innerHTML =
            '<div class="special-finish-panel">' +
                '<div class="finish-crown">👑</div>' +
                '<div class="finish-title">Queen</div>' +
                '<div class="finish-subtitle">' + (endMode === 'completed' ? 'Catálogo Completado' : 'Preview no disponible') + '</div>' +
                '<div class="finish-divider"></div>' +
                '<div class="finish-badge">' + (endMode === 'completed' ? 'FIN' : 'STOP') + '</div>' +
            '</div>';
        dashAudio.style.display = 'block';
        if (activeCardNumber) {
            activeCardNumber.textContent = 'Carta final';
            activeCardNumber.style.display = 'inline-block';
        }
        showAudioControls(false);
        if (btnBackMenu) {
            btnBackMenu.style.display = 'block';
            btnBackMenu.textContent = '🏠 VOLVER AL INICIO Y REINICIAR';
        }
        setPlayButtonLocked(true, endMode === 'completed' ? '🏁 JUEGO TERMINADO' : '⚠️ PREVIEW NO DISPONIBLE');
        setStatus(
            endMode === 'completed'
                ? '🏁 Has completado todo el catálogo actual. Reinicia la sesión para volver a empezar.'
                : '⚠️ No quedan previews jugables en este catálogo durante esta sesión. Reinicia o cambia de filtro.',
            endMode === 'completed' ? 'var(--primary-gold)' : 'var(--error-red)'
        );
    }

    function getAvailableSongs() {
        return filteredPool.filter(function(song) {
            var songKey = HisterCatalog.getSongKey(song);
            return !playedSongKeys.has(songKey) && !failedSongKeys.has(songKey);
        });
    }

    function syncCompletedStateFromProgress() {
        var available = getAvailableSongs();
        gameCompleted = filteredPool.length > 0 && available.length === 0 && completedFilter === getActiveCatalogKey();
    }

    function resetSession() {
        playedSongKeys.clear();
        failedSongKeys.clear();
        playedHistory = [];
        completedFilter = null;
        teams.forEach(function(team) {
            team.score = 0;
        });
        saveProgress();
        updateStats();
        renderHistory();
        renderScoreboard();
        resetToEmptyState();
        if (audio) audio.pause();
        setStatus('🔄 Sesión reiniciada', 'var(--primary-gold)');
    }

    // ── 6. Construir pool filtrado ─────────────────────────────
    function buildPool() {
        var val = filterSelect ? filterSelect.value : 'all';
        if (val === 'all') {
            filteredPool = queenSongs.slice();
        } else {
            filteredPool = HisterCatalog.filterByEra(queenSongs, val);
        }
        var settings = getPlaylistSettings();
        filteredPool = HisterCatalog.filterByDifficulty(filteredPool, settings.difficulty);
        filteredPool = HisterCatalog.filterByAlbum(filteredPool, settings.album);
        filteredPool = HisterCatalog.filterByCardNumbers(
            filteredPool,
            queenSongs,
            HisterCatalog.parseCardList(settings.manualCards, queenSongs.length)
        );
        filteredPool = HisterCatalog.limitSongs(filteredPool, settings.size);
        updateStats();
        if (countEl) countEl.textContent = filteredPool.length;
        
        if (activeEraBadge && filterSelect) {
            activeEraBadge.textContent = 'Época: ' + filterSelect.options[filterSelect.selectedIndex].text;
        }

        saveProgress();
        renderPlaylistSummary();
    }

    // ── 7. Estadísticas de sesión ─────────────────────────────
    function updateStats() {
        // Cuántas de este pool específico ya se han jugado
        var playedInPool = getPlayedSongsInPoolCount();
        var failedInPool = getFailedSongsInPoolCount();
        var remaining = filteredPool.length - playedInPool - failedInPool;
        if (statsPlayed)    statsPlayed.textContent    = playedInPool;
        if (statsRemaining) statsRemaining.textContent = Math.max(0, remaining);
    }

    // ── 8. Total canciones ────────────────────────────────────
    if (countEl2) countEl2.textContent = queenSongs.length;

    // ── 9. Audio helpers ──────────────────────────────────────
    function setStatus(text, color) {
        statusEl.textContent = text;
        statusEl.style.color = color || 'var(--text-main)';
    }

    function showPause()  { btnPause.style.display = 'inline-flex'; btnResume.style.display = 'none'; }
    function showResume() { btnPause.style.display = 'none';        btnResume.style.display = 'inline-flex'; }

    function pauseAudio() {
        audio.pause();
        clearAudioLoadTimer();
        showResume();
        if (!gameCompleted) {
            setStatus('⏸ Audio en pausa', 'var(--text-muted)');
        }
        clearInterval(progressTimer);
    }

    // ── 10. Barra de progreso de audio ─────────────────────────
    function startProgressBar() {
        if (!progressBar || !progressFill) return;
        progressBar.style.display = 'block';
        clearInterval(progressTimer);
        progressTimer = setInterval(function() {
            if (!audio.duration || isNaN(audio.duration)) return;
            var pct = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = pct + '%';
            if (pct >= 100) clearInterval(progressTimer);
        }, 200);
    }

    function resetProgressBar() {
        if (!progressFill) return;
        progressFill.style.width = '0%';
        clearInterval(progressTimer);
    }

    // ── 11. Reproducir canción aleatoria (sin repetir) ─────────
    function playRandomSong() {
        if (gameCompleted) {
            setStatus('🏁 La partida ya ha terminado. Vuelve al inicio y reinicia la sesión.', 'var(--primary-gold)');
            return;
        }

        revealCurrentSong();
        var available = getAvailableSongs();
        if (available.length === 0) {
            if (getFailedSongsInPoolCount() > 0 && getPlayedSongsInPoolCount() < filteredPool.length) {
                showCompletionCard('unavailable');
            } else {
                showCompletionCard('completed');
            }
            return;
        }

        playSong(available[Math.floor(Math.random() * available.length)]);
    }

    function playSong(song) {
        if (!song) return;
        currentSong = song;
        currentSongRevealed = false;
        playedSongKeys.add(HisterCatalog.getSongKey(currentSong));
        saveProgress();
        updateStats();

        showSongCard(currentSong);

        renderGameQr(currentSong.audioUrl);

        // Audio
        dashAudio.style.display = 'block';
        resetProgressBar();
        setStatus('⏳ Cargando audio...', 'var(--text-muted)');
        showPause();

        suppressAudioAbort = true;
        audio.pause();
        audio.src = currentSong.audioUrl;
        audio.load();
        startAudioLoadTimer();

        audio.play().then(function () {
            suppressAudioAbort = false;
            clearAudioLoadTimer();
            setStatus('🎵 Reproduciendo... ¡Adivina la canción!', 'var(--success-green)');
            showPause();
            startProgressBar();
        }).catch(function (err) {
            suppressAudioAbort = false;
            clearAudioLoadTimer();
            console.warn('Autoplay bloqueado:', err);
            if (err && err.name && err.name !== 'NotAllowedError') {
                setStatus('⚠️ No se pudo iniciar el preview. Pulsa Play para reintentar o saca otra canción.', 'var(--error-red)');
            } else {
                setStatus('▶ Pulsa Play para escuchar', 'var(--primary-gold)');
            }
            showResume();
        });
    }

    function playPrintedCardNumber() {
        var song = HisterCatalog.getSongByNumber(queenSongs, cardNumberInput ? cardNumberInput.value : '');
        if (!song) {
            if (cardLookupStatus) cardLookupStatus.textContent = 'Número no válido. Usa un valor entre 1 y ' + queenSongs.length + '.';
            return;
        }
        if (gameCompleted) {
            gameCompleted = false;
            completedFilter = null;
            setPlayButtonLocked(false, '🎤 SACAR NUEVA CANCIÓN');
        }
        if (cardLookupStatus) {
            cardLookupStatus.textContent = 'Carta #' + HisterCatalog.formatSongNumber(HisterCatalog.getSongNumber(queenSongs, song)) + ' cargada sin mostrar spoilers.';
        }
        revealCurrentSong();
        playSong(song);
    }

    function validatePreviewSong(song) {
        return new Promise(function(resolve) {
            var probe = new Audio();
            var done = false;
            var timer = setTimeout(function() {
                finish(false, 'timeout');
            }, 8000);

            function cleanup() {
                clearTimeout(timer);
                probe.removeAttribute('src');
                probe.load();
            }

            function finish(ok, reason) {
                if (done) return;
                done = true;
                cleanup();
                resolve({ ok: ok, reason: reason || '' });
            }

            probe.preload = 'metadata';
            probe.addEventListener('loadedmetadata', function() {
                finish(true);
            });
            probe.addEventListener('canplay', function() {
                finish(true);
            });
            probe.addEventListener('error', function() {
                finish(false, 'error');
            });
            probe.src = song.audioUrl;
            probe.load();
        });
    }

    function renderPreviewFailure(song, reason) {
        if (!previewCheckResults) return;
        var item = document.createElement('li');
        item.textContent = 'Carta #' +
            HisterCatalog.formatSongNumber(HisterCatalog.getSongNumber(queenSongs, song)) +
            ' · ' + song.title + ' (' + reason + ')';
        previewCheckResults.appendChild(item);
    }

    function runPreviewDiagnostics() {
        var pool = filteredPool.length ? filteredPool : queenSongs;
        var checked = 0;
        var failed = 0;

        if (!btnCheckPreviews || !previewCheckStatus || !previewCheckResults) return;
        btnCheckPreviews.disabled = true;
        previewCheckResults.innerHTML = '';
        previewCheckStatus.textContent = 'Comprobando 0/' + pool.length + ' previews...';

        function next() {
            if (checked >= pool.length) {
                previewCheckStatus.textContent = failed
                    ? 'Comprobación terminada: ' + failed + ' posibles fallos de ' + pool.length + '.'
                    : 'Comprobación terminada: todos los previews respondieron.';
                btnCheckPreviews.disabled = false;
                return;
            }

            var song = pool[checked];
            validatePreviewSong(song).then(function(result) {
                checked++;
                if (!result.ok) {
                    failed++;
                    renderPreviewFailure(song, result.reason);
                }
                previewCheckStatus.textContent = 'Comprobando ' + checked + '/' + pool.length + ' · fallos: ' + failed;
                next();
            });
        }

        next();
    }

    function exportSession() {
        var payload = {
            version: 1,
            exportedAt: new Date().toISOString(),
            playedSongKeys: Array.from(playedSongKeys),
            failedSongKeys: Array.from(failedSongKeys),
            playedHistory: playedHistory,
            filter: filterSelect ? filterSelect.value : 'all',
            completedFilter: completedFilter,
            rules: getRules(),
            playlist: getPlaylistSettings(),
            presenterMode: presenterMode ? presenterMode.checked : false,
            teams: teams,
            activeTeamId: activeTeamId
        };
        var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'hister-queen-session.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        if (sessionIoStatus) sessionIoStatus.textContent = 'Sesión exportada.';
    }

    function importSession(file) {
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function() {
            try {
                var payload = JSON.parse(reader.result);
                playedSongKeys = new Set(payload.playedSongKeys || []);
                failedSongKeys = new Set(payload.failedSongKeys || []);
                playedHistory = Array.isArray(payload.playedHistory) ? payload.playedHistory : [];
                completedFilter = payload.completedFilter || null;
                teams = Array.isArray(payload.teams) ? payload.teams : [];
                activeTeamId = payload.activeTeamId || (teams[0] && teams[0].id) || null;
                if (filterSelect && payload.filter) filterSelect.value = payload.filter;
                applyRules(payload.rules);
                applyPlaylistSettings(payload.playlist);
                if (presenterMode && typeof payload.presenterMode === 'boolean') {
                    presenterMode.checked = payload.presenterMode;
                }
                buildPool();
                renderRules();
                renderHistory();
                renderScoreboard();
                syncCompletedStateFromProgress();
                saveProgress();
                resetToEmptyState();
                if (sessionIoStatus) sessionIoStatus.textContent = 'Sesión importada correctamente.';
            } catch (e) {
                if (sessionIoStatus) sessionIoStatus.textContent = 'No se pudo importar el archivo.';
                console.warn(e);
            }
        };
        reader.readAsText(file);
    }

    // ── 12. Listeners de audio ────────────────────────────────
    btnPlay.addEventListener('click', playRandomSong);

    btnPause.addEventListener('click', function () { pauseAudio(); });

    btnResume.addEventListener('click', function () {
        if (!currentSong) return;
        startAudioLoadTimer();
        audio.play().then(function () {
            clearAudioLoadTimer();
            setStatus('🎵 Reproduciendo... ¡Adivina la canción!', 'var(--success-green)');
            showPause();
            startProgressBar();
        }).catch(function (e) {
            clearAudioLoadTimer();
            console.warn(e);
            setStatus('⚠️ No se pudo reanudar el preview. Pulsa Play de nuevo o saca otra canción.', 'var(--error-red)');
            showResume();
        });
    });

    btnRestart.addEventListener('click', function () {
        if (!currentSong) return;
        audio.currentTime = 0;
        resetProgressBar();
        startAudioLoadTimer();
        audio.play().then(function () {
            clearAudioLoadTimer();
            setStatus('🎵 Reproduciendo... ¡Adivina la canción!', 'var(--success-green)');
            showPause();
            startProgressBar();
        }).catch(function (e) {
            clearAudioLoadTimer();
            console.warn(e);
            setStatus('⚠️ No se pudo reiniciar el preview. Pulsa Play de nuevo o saca otra canción.', 'var(--error-red)');
            showResume();
        });
    });

    audio.addEventListener('canplay', function () {
        clearAudioLoadTimer();
    });

    audio.addEventListener('playing', function () {
        suppressAudioAbort = false;
        clearAudioLoadTimer();
    });

    audio.addEventListener('stalled', function () {
        if (!currentSong || gameCompleted) return;
        startAudioLoadTimer();
        setStatus('⚠️ La conexión va lenta. Esperando el preview...', 'var(--primary-gold)');
    });

    audio.addEventListener('abort', function () {
        clearAudioLoadTimer();
        if (suppressAudioAbort) {
            suppressAudioAbort = false;
            return;
        }
        if (!currentSong || gameCompleted) return;
        discardCurrentSongFromSession('⚠️ La carga del preview se interrumpió.');
    });

    audio.addEventListener('error', function () {
        if (!currentSong || gameCompleted) return;
        suppressAudioAbort = false;
        var code = audio.error ? audio.error.code : 0;
        var detail = '';
        if (code === 2) detail = ' Problema de red.';
        if (code === 3) detail = ' El archivo parece corrupto.';
        if (code === 4) detail = ' Formato o recurso no compatible.';
        discardCurrentSongFromSession('⚠️ No se pudo cargar el preview.' + detail);
    });

    audio.addEventListener('ended', function () {
        clearAudioLoadTimer();
        showResume();
        if (!gameCompleted) {
            setStatus('⏹ Pista terminada — ¡Toma tu decisión!', 'var(--text-muted)');
        }
        clearInterval(progressTimer);
        if (progressFill) progressFill.style.width = '100%';
    });

    // ── 13. Girar carta ───────────────────────────────────────
    btnFlip.addEventListener('click', function () {
        activeCard.classList.add('is-flipped');
        revealCurrentSong();
        pauseAudio();
    });

    activeCard.addEventListener('click', function () {
        if (presenterMode && presenterMode.checked) return;
        activeCard.classList.toggle('is-flipped');
        if (activeCard.classList.contains('is-flipped')) {
            revealCurrentSong();
            pauseAudio();
        }
    });

    // ── 14. Reset de sesión ───────────────────────────────────
    if (btnReset) {
        btnReset.addEventListener('click', resetSession);
    }

    if (btnBackMenu) {
        btnBackMenu.addEventListener('click', function () {
            if (gameCompleted) {
                resetSession();
                return;
            }
            resetToEmptyState();
            if (audio) pauseAudio();
        });
    }

    // ── 15. Filtro por era ────────────────────────────────────
    if (filterSelect) {
        filterSelect.addEventListener('change', function () {
            buildPool();
            syncCompletedStateFromProgress();
            if (countEl) countEl.textContent = filteredPool.length;
            // Feedback visual
            var label = filterSelect.options[filterSelect.selectedIndex].text;
            setStatus('🎸 Filtro: ' + label + ' (' + filteredPool.length + ' canciones)', 'var(--primary-gold)');
            if (gameCompleted) {
                showCompletionCard();
                return;
            }
            resetToEmptyState();
            if (audio) pauseAudio();
        });
    }

    if (ruleYear) ruleYear.addEventListener('change', renderRules);
    if (ruleTitle) ruleTitle.addEventListener('change', renderRules);
    if (ruleAlbum) ruleAlbum.addEventListener('change', renderRules);
    [difficultySelect, albumSelect, playlistSizeSelect].forEach(function(control) {
        if (!control) return;
        control.addEventListener('change', function() {
            buildPool();
            syncCompletedStateFromProgress();
            resetToEmptyState();
            if (audio) pauseAudio();
        });
    });
    if (manualCardList) {
        manualCardList.addEventListener('change', function() {
            buildPool();
            syncCompletedStateFromProgress();
            resetToEmptyState();
            if (audio) pauseAudio();
        });
    }
    if (btnPlayCardNumber) btnPlayCardNumber.addEventListener('click', playPrintedCardNumber);
    if (cardNumberInput) {
        cardNumberInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') playPrintedCardNumber();
        });
    }
    if (btnCheckPreviews) btnCheckPreviews.addEventListener('click', runPreviewDiagnostics);
    if (presenterMode) presenterMode.addEventListener('change', saveProgress);
    if (btnAddTeam) btnAddTeam.addEventListener('click', addTeam);
    if (teamNameInput) {
        teamNameInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') addTeam();
        });
    }
    if (btnScoreYear) btnScoreYear.addEventListener('click', function() { updateTeamScore(getScoreValue('year')); });
    if (btnScoreTitle) btnScoreTitle.addEventListener('click', function() { updateTeamScore(getScoreValue('title')); });
    if (btnScoreAlbum) btnScoreAlbum.addEventListener('click', function() { updateTeamScore(getScoreValue('album')); });
    if (btnScorePlusOne) btnScorePlusOne.addEventListener('click', function() { updateTeamScore(1); });
    if (btnScoreMinusOne) btnScoreMinusOne.addEventListener('click', function() { updateTeamScore(-1); });
    if (btnExportSession) btnExportSession.addEventListener('click', exportSession);
    if (importSessionFile) {
        importSessionFile.addEventListener('change', function() {
            importSession(importSessionFile.files[0]);
            importSessionFile.value = '';
        });
    }

    // ── 16. Imprimir ──────────────────────────────────────────
    btnPrint.addEventListener('click', function () { window.print(); });

    // ── 17. Navegación ────────────────────────────────────────
    function goToGame() {
        if (gameCompleted) {
            resetSession();
        }
        screenGame.style.display  = '';
        screenCards.style.display = 'none';
        navGame.classList.add('active');
        navCards.classList.remove('active');
    }

    function goToCards() {
        screenGame.style.display  = 'none';
        screenCards.style.display = 'flex';
        navCards.classList.add('active');
        navGame.classList.remove('active');
        pauseAudio();
        if (!cardsGenerated) {
            HisterPrintCards.generate(document.getElementById('cards-container'), queenSongs, renderPrintQr);
            cardsGenerated = true;
            if (countEl2) countEl2.textContent = queenSongs.length;
        }
    }

    navGame.addEventListener('click',  goToGame);
    navCards.addEventListener('click', goToCards);
    goToGame();

    // ── 18. Inicializar pool, stats e historial ─────────────────
    if (window.location.protocol !== 'file:') {
        var manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = 'manifest.webmanifest';
        document.head.appendChild(manifestLink);
    }

    buildPool();
    renderHistory();
    renderScoreboard();
    syncCompletedStateFromProgress();
    if (gameCompleted) {
        showCompletionCard();
    }
    renderRules();

    if (window.location.protocol !== 'file:' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(function(error) {
            console.log('No se pudo registrar el service worker.', error);
        });
    }

}; // fin window.onload
