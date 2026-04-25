(function (global) {
    'use strict';

    function createCard(song, index, renderPrintQr) {
        var cardNumber = index + 1;
        var card = document.createElement('div');
        card.className = 'card';

        var badge = document.createElement('div');
        badge.className = 'card-number-badge';
        badge.textContent = 'Carta #' + global.HisterCatalog.formatSongNumber(cardNumber);

        var brand = document.createElement('div');
        brand.className = 'print-card-brand';
        brand.textContent = 'Queen Edition';

        var qrWrap = document.createElement('div');
        qrWrap.className = 'card-qr';

        var info = document.createElement('div');
        info.className = 'card-info';
        var title = document.createElement('h3');
        title.textContent = 'Carta de juego';
        var listen = document.createElement('p');
        listen.innerHTML = '<strong>Escucha:</strong> escanea el QR';
        var goal = document.createElement('p');
        goal.innerHTML = '<strong>Reto:</strong> año, título y álbum';
        var note = document.createElement('p');
        note.className = 'screen-card-note';
        note.textContent = 'Sin spoilers. Usa el número si el QR falla.';
        info.appendChild(title);
        info.appendChild(listen);
        info.appendChild(goal);
        info.appendChild(note);

        card.appendChild(badge);
        card.appendChild(brand);
        card.appendChild(qrWrap);
        card.appendChild(info);

        renderPrintQr(qrWrap, song.audioUrl || 'https://queenofficial.com');
        return card;
    }

    function generatePrintCards(container, songs, renderPrintQr) {
        container.innerHTML = '';

        songs.forEach(function (song, index) {
            container.appendChild(createCard(song, index, renderPrintQr));
        });
    }

    function generatePrintCardsAsync(container, songs, renderPrintQr, options) {
        var settings = options || {};
        var batchSize = settings.batchSize || 12;
        var index = 0;

        container.innerHTML = '';
        if (settings.onProgress) {
            settings.onProgress({ done: 0, total: songs.length, percent: 0 });
        }

        return new Promise(function(resolve) {
            function renderBatch() {
                var fragment = document.createDocumentFragment();
                var end = Math.min(index + batchSize, songs.length);

                while (index < end) {
                    fragment.appendChild(createCard(songs[index], index, renderPrintQr));
                    index += 1;
                }

                container.appendChild(fragment);
                if (settings.onProgress) {
                    settings.onProgress({
                        done: index,
                        total: songs.length,
                        percent: songs.length ? Math.round((index / songs.length) * 100) : 100
                    });
                }

                if (index < songs.length) {
                    global.setTimeout(renderBatch, 0);
                    return;
                }

                resolve();
            }

            global.requestAnimationFrame(renderBatch);
        });
    }

    global.HisterPrintCards = {
        generate: generatePrintCards,
        generateAsync: generatePrintCardsAsync
    };
}(window));
