(function (global) {
    'use strict';

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function createFallbackMarkup(url, compact) {
        var safeUrl = escapeHtml(url || '');
        var className = compact ? 'qr-fallback qr-fallback-compact' : 'qr-fallback';
        return (
            '<div class="' + className + '">' +
                '<div class="qr-fallback-label">QR no disponible</div>' +
                '<div class="qr-fallback-url">' + safeUrl + '</div>' +
            '</div>'
        );
    }

    function createRenderer(options) {
        var qrLibraryAvailable = typeof global.QRCode !== 'undefined';
        var qrWarningShown = false;

        function notifyUnavailable() {
            if (qrWarningShown || (options.isGameCompleted && options.isGameCompleted())) return;
            qrWarningShown = true;
            options.setStatus(
                '⚠️ El generador QR no está disponible. Puedes seguir jugando con los controles de audio.',
                'var(--primary-gold)'
            );
        }

        function resetGameQrContainer(qrBox) {
            if (!qrBox || !qrBox.parentNode) return qrBox;
            var freshQrBox = document.createElement('div');
            freshQrBox.id = 'game-qr-code';
            qrBox.parentNode.replaceChild(freshQrBox, qrBox);
            return freshQrBox;
        }

        function renderGameQr(qrBox, url) {
            if (!qrLibraryAvailable) {
                qrBox.innerHTML = createFallbackMarkup(url, false);
                notifyUnavailable();
                return qrBox;
            }

            try {
                var freshQrBox = resetGameQrContainer(qrBox);
                new global.QRCode(freshQrBox, {
                    text: url,
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff'
                });
                return freshQrBox;
            } catch (e) {
                qrLibraryAvailable = false;
                qrBox.innerHTML = createFallbackMarkup(url, false);
                notifyUnavailable();
                return qrBox;
            }
        }

        function renderPrintQr(target, url) {
            if (!qrLibraryAvailable) {
                target.innerHTML = createFallbackMarkup(url, true);
                return;
            }

            try {
                new global.QRCode(target, {
                    text: url || 'https://queenofficial.com',
                    width: 130,
                    height: 130,
                    colorDark: '#000000',
                    colorLight: '#ffffff'
                });
            } catch (e) {
                qrLibraryAvailable = false;
                target.innerHTML = createFallbackMarkup(url, true);
            }
        }

        return {
            resetGameQrContainer: resetGameQrContainer,
            renderGameQr: renderGameQr,
            renderPrintQr: renderPrintQr
        };
    }

    global.HisterQrRenderer = {
        create: createRenderer,
        createFallbackMarkup: createFallbackMarkup
    };
}(window));
