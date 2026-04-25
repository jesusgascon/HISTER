(function (global) {
    'use strict';

    function validatePreviewSong(song, timeoutMs) {
        return new Promise(function(resolve) {
            var probe = new Audio();
            var done = false;
            var timer = setTimeout(function() {
                finish(false, 'timeout');
            }, timeoutMs || 8000);

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

    function runPreviewDiagnostics(options) {
        var pool = options.pool && options.pool.length ? options.pool : options.allSongs;
        var checked = 0;
        var failed = 0;
        var cursor = 0;
        var concurrency = Math.max(1, options.concurrency || 4);
        var cancelled = false;

        options.onStart(pool.length);

        function update() {
            options.onProgress(checked, pool.length, failed);
        }

        function next() {
            if (cancelled) return;
            if (checked >= pool.length) {
                options.onDone(failed, pool.length);
                return;
            }
            while (cursor < pool.length && cursor - checked < concurrency) {
                runOne(pool[cursor++]);
            }
        }

        function runOne(song) {
            validatePreviewSong(song, options.timeoutMs).then(function(result) {
                if (cancelled) return;
                checked++;
                if (!result.ok) {
                    failed++;
                    options.onFailure(song, result.reason);
                }
                update();
                next();
            });
        }

        next();

        return {
            cancel: function () {
                cancelled = true;
                options.onCancel(checked, pool.length, failed);
            }
        };
    }

    global.HisterDiagnostics = {
        runPreviewDiagnostics: runPreviewDiagnostics,
        validatePreviewSong: validatePreviewSong
    };
}(window));
