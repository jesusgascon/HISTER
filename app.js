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

    // ── 4. Estado (con almacenamiento local) ─────────────────
    var currentSong    = null;
    var qrInstance     = null;
    var cardsGenerated = false;
    var playedUrls     = new Set();
    var progressTimer  = null;
    var filteredPool   = [];
    var playedHistory  = [];
    var currentSongRevealed = false;

    // Cargar progreso previo
    try {
        var savedData = localStorage.getItem('hister_queen_played');
        if (savedData) {
            var arr = JSON.parse(savedData);
            arr.forEach(function(url) { playedUrls.add(url); });
        }
        var savedHistory = localStorage.getItem('hister_queen_history');
        if (savedHistory) {
            playedHistory = JSON.parse(savedHistory).filter(function(item) {
                return item && item.audioUrl && queenSongs.some(function(song) {
                    return song.audioUrl === item.audioUrl;
                });
            });
        }
        var savedFilter = localStorage.getItem('hister_queen_filter');
        if (savedFilter && filterSelect) {
            filterSelect.value = savedFilter;
        }
    } catch (e) {
        console.log('No se pudo cargar progreso anterior.', e);
    }

    function saveProgress() {
        try {
            var arr = Array.from(playedUrls);
            localStorage.setItem('hister_queen_played', JSON.stringify(arr));
            localStorage.setItem('hister_queen_history', JSON.stringify(playedHistory));
            if (filterSelect) {
                localStorage.setItem('hister_queen_filter', filterSelect.value);
            }
        } catch (e) {}
    }

    // ── 5. Historial de canciones jugadas ────────────────────────
    function addToHistory(song) {
        playedHistory = playedHistory.filter(function(item) {
            return item.audioUrl !== song.audioUrl;
        });
        playedHistory.unshift({
            title: song.title,
            year: song.year,
            album: song.album,
            audioUrl: song.audioUrl
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
        var playedInPool = 0;
        for (var i = 0; i < filteredPool.length; i++) {
            if (playedUrls.has(filteredPool[i].audioUrl)) playedInPool++;
        }
        var remaining = filteredPool.length - playedInPool;
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
        showResume();
        setStatus('⏸ Audio en pausa', 'var(--text-muted)');
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
        revealCurrentSong();
        // Elegir índice no repetido del pool
        var available = [];
        for (var i = 0; i < filteredPool.length; i++) {
            if (!playedUrls.has(filteredPool[i].audioUrl)) available.push(i);
        }

        // Si se han jugado todas, reiniciar automáticamente el pool actual
        if (available.length === 0) {
            for (var j = 0; j < filteredPool.length; j++) {
                playedUrls.delete(filteredPool[j].audioUrl);
                available.push(j);
            }
            setStatus('🔄 ¡Vuelta completa en este catálogo! Reiniciando...', 'var(--primary-gold)');
        }

        var pick = available[Math.floor(Math.random() * available.length)];
        currentSong = filteredPool[pick];
        currentSongRevealed = false;
        playedUrls.add(currentSong.audioUrl);
        saveProgress();
        updateStats();

        // Mostrar carta (frente)
        emptyState.style.display   = 'none';
        cardContainer.style.display = 'block';
        activeCard.classList.remove('is-flipped');

        // Rellenar trasera
        ansYear.textContent  = currentSong.year;
        ansTitle.textContent = currentSong.title;
        ansAlbum.textContent = currentSong.album;

        // QR
        try {
            if (!qrInstance) {
                qrBox.innerHTML = '';
                qrInstance = new QRCode(qrBox, {
                    text: currentSong.audioUrl,
                    width: 200, height: 200,
                    colorDark: '#000000', colorLight: '#ffffff'
                });
            } else {
                qrInstance.clear();
                qrInstance.makeCode(currentSong.audioUrl);
            }
        } catch (e) {
            qrBox.textContent = '↑ Audio URL';
        }

        // Audio
        dashAudio.style.display = 'block';
        resetProgressBar();
        setStatus('⏳ Cargando audio...', 'var(--text-muted)');
        showPause();

        audio.pause();
        audio.src = currentSong.audioUrl;
        audio.load();

        audio.play().then(function () {
            setStatus('🎵 Reproduciendo... ¡Adivina la canción!', 'var(--success-green)');
            showPause();
            startProgressBar();
        }).catch(function (err) {
            console.warn('Autoplay bloqueado:', err);
            setStatus('▶ Pulsa Play para escuchar', 'var(--primary-gold)');
            showResume();
        });
    }

    // ── 12. Listeners de audio ────────────────────────────────
    btnPlay.addEventListener('click', playRandomSong);

    btnPause.addEventListener('click', function () { pauseAudio(); });

    btnResume.addEventListener('click', function () {
        if (!currentSong) return;
        audio.play().then(function () {
            setStatus('🎵 Reproduciendo... ¡Adivina la canción!', 'var(--success-green)');
            showPause();
            startProgressBar();
        }).catch(function (e) { console.warn(e); });
    });

    btnRestart.addEventListener('click', function () {
        if (!currentSong) return;
        audio.currentTime = 0;
        resetProgressBar();
        audio.play().then(function () {
            setStatus('🎵 Reproduciendo... ¡Adivina la canción!', 'var(--success-green)');
            showPause();
            startProgressBar();
        }).catch(function (e) { console.warn(e); });
    });

    audio.addEventListener('ended', function () {
        showResume();
        setStatus('⏹ Pista terminada — ¡Toma tu decisión!', 'var(--text-muted)');
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
        btnReset.addEventListener('click', function () {
            playedUrls.clear();
            playedHistory = [];
            saveProgress();
            updateStats();
            renderHistory();
            setStatus('🔄 Sesión reiniciada', 'var(--primary-gold)');
            
            // Ocultar card actual y menu de audio, volver a estado "vacio"
            dashAudio.style.display = 'none';
            cardContainer.style.display = 'none';
            emptyState.style.display = 'block';
            activeCard.classList.remove('is-flipped');
            currentSong = null;
            currentSongRevealed = false;
            if (audio) pauseAudio();
        });
    }

    if (btnBackMenu) {
        btnBackMenu.addEventListener('click', function () {
            // Solo ocultar card actual y menu de audio, volver a estado "vacio" manteniendo progreso
            dashAudio.style.display = 'none';
            cardContainer.style.display = 'none';
            emptyState.style.display = 'block';
            activeCard.classList.remove('is-flipped');
            currentSong = null;
            currentSongRevealed = false;
            if (audio) pauseAudio();
        });
    }

    // ── 15. Filtro por era ────────────────────────────────────
    if (filterSelect) {
        filterSelect.addEventListener('change', function () {
            buildPool();
            if (countEl) countEl.textContent = filteredPool.length;
            // Feedback visual
            var label = filterSelect.options[filterSelect.selectedIndex].text;
            setStatus('🎸 Filtro: ' + label + ' (' + filteredPool.length + ' canciones)', 'var(--primary-gold)');
            
            // Ocultar card actual y menu de audio, volver a estado "vacio"
            dashAudio.style.display = 'none';
            cardContainer.style.display = 'none';
            emptyState.style.display = 'block';
            activeCard.classList.remove('is-flipped');
            currentSong = null;
            currentSongRevealed = false;
            if (audio) pauseAudio();
        });
    }

    // ── 16. Imprimir ──────────────────────────────────────────
    btnPrint.addEventListener('click', function () { window.print(); });

    // ── 17. Navegación ────────────────────────────────────────
    function goToGame() {
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
                '<h3>' + song.title + '</h3>' +
                '<p><strong>Año:</strong> ' + song.year + '</p>' +
                '<p><strong>Álbum:</strong> ' + song.album + '</p>';

            card.appendChild(qrWrap);
            card.appendChild(info);
            container.appendChild(card);

            try {
                new QRCode(qrWrap, {
                    text: song.audioUrl || 'https://queenofficial.com',
                    width: 130, height: 130,
                    colorDark: '#000000', colorLight: '#ffffff'
                });
            } catch (e) {}
        });
    }

}; // fin window.onload



