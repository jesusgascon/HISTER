// ============================================================
//  HITSTER QUEEN EDITION - app.js
// ============================================================

window.onload = function () {

    // ── 1. Comprobar datos ────────────────────────────────────
    if (typeof queenSongs === 'undefined' || !queenSongs.length) {
        console.error('queenSongs no cargado.');
        return;
    }

    // ── 2. Fondo aleatorio ────────────────────────────────────
    var backgroundImages = ['queen_concert_bg.png', 'queen_concert_bg_alt.png'];
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
    var cardTitleEl    = activeCard ? activeCard.querySelector('.card-title') : null;
    var scanTextEl     = activeCard ? activeCard.querySelector('.scan-text') : null;
    var backTitleEl    = activeCard ? activeCard.querySelector('.back-title') : null;
    var answerLabels   = activeCard ? activeCard.querySelectorAll('.answer-label') : [];
    var audioControls  = document.querySelector('.audio-controls');

    // ── 4. Estado (con almacenamiento local) ─────────────────
    var currentSong    = null;
    var qrInstance     = null;
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
    var qrLibraryAvailable = typeof QRCode !== 'undefined';
    var qrWarningShown = false;

    function getSongKey(song) {
        return [song.year, song.album, song.title].join('||');
    }

    function getSongKeyFromStoredValue(value) {
        if (!value) return null;
        if (value.indexOf('||') !== -1) return value;
        for (var i = 0; i < queenSongs.length; i++) {
            if (queenSongs[i].audioUrl === value) return getSongKey(queenSongs[i]);
        }
        return null;
    }

    function getSongByKey(songKey) {
        for (var i = 0; i < queenSongs.length; i++) {
            if (getSongKey(queenSongs[i]) === songKey) return queenSongs[i];
        }
        return null;
    }

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
        } catch (e) {}
    }

    // ── 5. Historial de canciones jugadas ────────────────────────
    function addToHistory(song) {
        var songKey = getSongKey(song);
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
            if (playedSongKeys.has(getSongKey(filteredPool[i]))) count++;
        }
        return count;
    }

    function getFailedSongsInPoolCount() {
        var count = 0;
        for (var i = 0; i < filteredPool.length; i++) {
            if (failedSongKeys.has(getSongKey(filteredPool[i]))) count++;
        }
        return count;
    }

    function discardCurrentSongFromSession(message) {
        if (!currentSong) {
            handleAudioFailure(message);
            return;
        }

        var songKey = getSongKey(currentSong);
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

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function createQrFallbackMarkup(url, compact) {
        var safeUrl = escapeHtml(url || '');
        var className = compact ? 'qr-fallback qr-fallback-compact' : 'qr-fallback';
        return (
            '<div class="' + className + '">' +
                '<div class="qr-fallback-label">QR no disponible</div>' +
                '<div class="qr-fallback-url">' + safeUrl + '</div>' +
            '</div>'
        );
    }

    function notifyQrUnavailable() {
        if (qrWarningShown || gameCompleted) return;
        qrWarningShown = true;
        setStatus('⚠️ El generador QR no está disponible. Puedes seguir jugando con los controles de audio.', 'var(--primary-gold)');
    }

    function resetGameQrContainer() {
        if (!qrBox || !qrBox.parentNode) return;
        var freshQrBox = document.createElement('div');
        freshQrBox.id = 'game-qr-code';
        qrBox.parentNode.replaceChild(freshQrBox, qrBox);
        qrBox = freshQrBox;
        qrInstance = null;
    }

    function renderGameQr(url) {
        if (!qrLibraryAvailable) {
            qrBox.innerHTML = createQrFallbackMarkup(url, false);
            notifyQrUnavailable();
            return;
        }

        try {
            resetGameQrContainer();
            qrInstance = new QRCode(qrBox, {
                text: url,
                width: 200, height: 200,
                colorDark: '#000000', colorLight: '#ffffff'
            });
        } catch (e) {
            qrLibraryAvailable = false;
            qrInstance = null;
            qrBox.innerHTML = createQrFallbackMarkup(url, false);
            notifyQrUnavailable();
        }
    }

    function renderPrintQr(target, url) {
        if (!qrLibraryAvailable) {
            target.innerHTML = createQrFallbackMarkup(url, true);
            return;
        }

        try {
            new QRCode(target, {
                text: url || 'https://queenofficial.com',
                width: 130, height: 130,
                colorDark: '#000000', colorLight: '#ffffff'
            });
        } catch (e) {
            qrLibraryAvailable = false;
            target.innerHTML = createQrFallbackMarkup(url, true);
        }
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
        if (cardTitleEl) cardTitleEl.textContent = 'Hitster Queen';
        if (scanTextEl) scanTextEl.innerHTML = 'Escanea el QR para escuchar<br>o usa los controles de la derecha';
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
        completedFilter = endMode === 'completed' ? (filterSelect ? filterSelect.value : 'all') : null;
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
            var songKey = getSongKey(song);
            return !playedSongKeys.has(songKey) && !failedSongKeys.has(songKey);
        });
    }

    function syncCompletedStateFromProgress() {
        var currentFilter = filterSelect ? filterSelect.value : 'all';
        var available = getAvailableSongs();
        gameCompleted = filteredPool.length > 0 && available.length === 0 && completedFilter === currentFilter;
    }

    function resetSession() {
        playedSongKeys.clear();
        failedSongKeys.clear();
        playedHistory = [];
        completedFilter = null;
        saveProgress();
        updateStats();
        renderHistory();
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
            var parts = val.split('-');
            var from = parseInt(parts[0]);
            var to   = parseInt(parts[1]);
            filteredPool = queenSongs.filter(function(s) {
                return s.year >= from && s.year <= to;
            });
        }
        updateStats();
        if (countEl) countEl.textContent = filteredPool.length;
        
        if (activeEraBadge && filterSelect) {
            activeEraBadge.textContent = 'Época: ' + filterSelect.options[filterSelect.selectedIndex].text;
        }

        saveProgress();
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

        currentSong = available[Math.floor(Math.random() * available.length)];
        currentSongRevealed = false;
        playedSongKeys.add(getSongKey(currentSong));
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
            generatePrintCards();
            cardsGenerated = true;
            if (countEl2) countEl2.textContent = queenSongs.length;
        }
    }

    navGame.addEventListener('click',  goToGame);
    navCards.addEventListener('click', goToCards);
    goToGame();

    // ── 18. Inicializar pool, stats e historial ─────────────────
    buildPool();
    renderHistory();
    syncCompletedStateFromProgress();
    if (gameCompleted) {
        showCompletionCard();
    }

    // ── 19. Generar cartas imprimibles ────────────────────────
    function generatePrintCards() {
        var container = document.getElementById('cards-container');
        container.innerHTML = '';

        queenSongs.forEach(function (song) {
            var card = document.createElement('div');
            card.className = 'card';

            var qrWrap = document.createElement('div');
            qrWrap.className = 'card-qr';

            var info = document.createElement('div');
            info.className = 'card-info';
            info.innerHTML =
                '<h3>Colección Queen</h3>' +
                '<p><strong>Escucha:</strong> usa el QR para reproducir</p>' +
                '<p><strong>Objetivo:</strong> adivina año, título y álbum</p>';

            card.appendChild(qrWrap);
            card.appendChild(info);
            container.appendChild(card);

            renderPrintQr(qrWrap, song.audioUrl || 'https://queenofficial.com');
        });
    }

}; // fin window.onload
