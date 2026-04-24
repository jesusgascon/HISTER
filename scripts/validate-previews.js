const https = require('https');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const dataCode = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(`${dataCode}; this.queenSongs = queenSongs;`, context, { filename: 'data.js' });

const args = new Map(
    process.argv.slice(2).map((arg) => {
        const [key, value] = arg.replace(/^--/, '').split('=');
        return [key, value || true];
    })
);

const timeoutMs = Number(args.get('timeout') || 8000);
const concurrency = Number(args.get('concurrency') || 8);
const limit = args.has('limit') ? Number(args.get('limit')) : context.queenSongs.length;
const songs = context.queenSongs.slice(0, limit);

function requestPreview(song, method) {
    return new Promise((resolve) => {
        const req = https.request(song.audioUrl, {
            method,
            timeout: timeoutMs,
            headers: method === 'GET' ? { Range: 'bytes=0-0' } : {}
        }, (res) => {
            res.resume();
            resolve({
                ok: res.statusCode >= 200 && res.statusCode < 400,
                statusCode: res.statusCode,
                method
            });
        });

        req.on('timeout', () => {
            req.destroy(new Error('timeout'));
        });
        req.on('error', (error) => {
            resolve({ ok: false, error: error.message, method });
        });
        req.end();
    });
}

async function validatePreview(song) {
    const head = await requestPreview(song, 'HEAD');
    if (head.ok) return head;
    const get = await requestPreview(song, 'GET');
    return get.ok ? get : head;
}

async function runPool(items, workerCount, worker) {
    const failures = [];
    let index = 0;

    async function runWorker() {
        while (index < items.length) {
            const itemIndex = index++;
            const item = items[itemIndex];
            const result = await worker(item);
            if (!result.ok) {
                failures.push({ song: item, result });
            }
            process.stdout.write(result.ok ? '.' : 'F');
        }
    }

    await Promise.all(Array.from({ length: workerCount }, runWorker));
    process.stdout.write('\n');
    return failures;
}

runPool(songs, concurrency, validatePreview).then((failures) => {
    if (failures.length) {
        failures.forEach(({ song, result }) => {
            console.error(`${song.year} - ${song.title}: ${result.statusCode || result.error} (${result.method})`);
        });
        process.exit(1);
    }
    console.log(`Preview URLs OK: ${songs.length} checked.`);
}).catch((error) => {
    console.error(error);
    process.exit(1);
});
