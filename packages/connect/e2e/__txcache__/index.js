const fs = require('fs');
const path = require('path');

// collect all json files
// { [key: txhash] => json }

const cacheFiles = (dir, cache = {}) => {
    const dirFiles = fs.readdirSync(dir);
    dirFiles.forEach(file => {
        const filePath = path.resolve(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            cacheFiles(filePath, cache);
        } else if (file.endsWith('.json')) {
            // use shortened hash
            const key = file.substring(0, 6);
            if (cache[key]) throw Error(`TX_CACHE duplicated key: ${key} file: ${file}`);

            try {
                const rawJson = fs.readFileSync(filePath);
                const content = JSON.parse(rawJson);
                cache[key] = {
                    ...content,
                    hash: file.split('.')[0], // add hash into object, required by @trezor/connect params
                };
            } catch (error) {
                console.error(`TX_CACHE parsing error: ${file}`);
                throw error;
            }
        }
    });

    return cache;
};

// read cache directory
const CACHE = cacheFiles(path.resolve(__dirname));

// txs: string[]; collection of requested tx shortened hashes
// force: boolean; force cache usage for coins without public/default backends (like zcash testnet)

const TX_CACHE = (txs, force = false) => {
    if (process.env.TESTS_USE_TX_CACHE === 'false' && !force) return [];

    return txs.map(hash => {
        if (!CACHE[hash]) {
            throw Error(`TX_CACHE for ${hash} is undefined`);
        }

        return CACHE[hash];
    });
};

module.exports = {
    CACHE,
    TX_CACHE,
};
