/* eslint-disable no-console */

import fs from 'fs';
import http from 'http';

import { getAnonymityScores } from '../../src/client/analyzeTransactions';
import { getNetwork } from '../../src/utils/settingsUtils';
import { getAccountInfo, getAccountInfoParams } from './discovery';

const [network, descriptor] = process.argv.slice(2);

const CACHE_DIR = `${__dirname}/.cache`;
const CACHE_ACCOUNT_INFO = `${CACHE_DIR}/accountInfo.json`;
const CACHE_PARAMS = `${CACHE_DIR}/anonymityScoreParams.json`;

/**
 * Semi e2e test for debugging purposes
 *
 * NOTE: this test expects coinjoin-backend or coinjoin middleware to be present.
 * see `middlewareUrl` below
 *
 * Usage:
 * `yarn workspace @trezor/coinjoin test:anonymity [COIN] [XPUB]`
 *
 * Result:
 * 1. Reads accountInfo using CoinjoinBackend
 * 2. Use accountInfo to calculate anonymity scores in coinjoin middleware
 * 3. stores both accountInfo and params used in middleware in `.cache` directory
 */

(async () => {
    console.log('✅', 'Start');

    // create cache directory
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR);
    }

    // override `http.request` to get exact params sent to middleware
    // params are stored in CACHE_DIR/CACHE_PARAMS file
    const originalHttpRequest = http.request;
    http.request = options => {
        if (
            typeof options === 'object' &&
            'pathname' in options &&
            options.pathname.includes('get-anonymity-scores')
        ) {
            const chunks: Buffer[] = [];
            const req = originalHttpRequest(options);
            const originalWrite = req.write.bind(req);
            req.write = (chunk: Buffer) => {
                chunks.push(chunk);

                return originalWrite(chunk);
            };

            req.on('finish', () => {
                const data = Buffer.concat(chunks).toString('utf-8');
                fs.writeFileSync(CACHE_PARAMS, JSON.stringify(JSON.parse(data), null, 4));
            });

            return req;
        }

        return originalHttpRequest(options);
    };

    // check if account is already discovered and cached
    const transactions: Parameters<typeof getAnonymityScores>[0] = [];
    let cached = false;
    try {
        const content = fs.readFileSync(CACHE_ACCOUNT_INFO);
        if (content) {
            console.log(`Serving accountInfo from cache...`);
            const accountInfo = JSON.parse(content.toString('utf-8'));
            if (accountInfo.descriptor === descriptor) {
                transactions.push(...accountInfo.history.transactions);
                cached = true;
            }
        }
    } catch (e) {
        // do nothing
    }

    if (!cached) {
        const params = getAccountInfoParams(network, descriptor);
        const accountInfo = await getAccountInfo(params);
        transactions.push(...accountInfo.history.transactions);
        fs.writeFileSync(CACHE_ACCOUNT_INFO, JSON.stringify(accountInfo, null, 4));
    }

    const anonScores = await getAnonymityScores(transactions, {
        // middlewareUrl: 'http://localhost:8081/client/',
        middlewareUrl: 'http://localhost:37128/',
        network: getNetwork(network as any),
        signal: new AbortController().signal,
        logger: {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
        },
    });

    console.log('✅', 'End, printing anonymity scores:');
    console.log(anonScores);
})();
