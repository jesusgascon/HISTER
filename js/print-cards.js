(function (global) {
    'use strict';

    function generatePrintCards(container, songs, renderPrintQr) {
        container.innerHTML = '';

        songs.forEach(function (song, index) {
            var cardNumber = index + 1;
            var card = document.createElement('div');
            card.className = 'card';

            var badge = document.createElement('div');
            badge.className = 'card-number-badge';
            badge.textContent = 'Carta #' + global.HisterCatalog.formatSongNumber(cardNumber);

            var qrWrap = document.createElement('div');
            qrWrap.className = 'card-qr';

            var info = document.createElement('div');
            info.className = 'card-info';
            info.innerHTML =
                '<h3>Colección Queen</h3>' +
                '<p><strong>Escucha:</strong> usa el QR para reproducir</p>' +
                '<p><strong>Objetivo:</strong> adivina año, título y álbum</p>';

            card.appendChild(badge);
            card.appendChild(qrWrap);
            card.appendChild(info);
            container.appendChild(card);

            renderPrintQr(qrWrap, song.audioUrl || 'https://queenofficial.com');
        });
    }

    global.HisterPrintCards = {
        generate: generatePrintCards
    };
}(window));
