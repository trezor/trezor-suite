/* eslint-disable no-console */

import fs from 'fs';

import { noopLogger } from '@trezor/logger';

import { getAccountInfo, getAccountInfoParams } from './discovery';
import { getAnonymityScores, getAnonymityScoresRequest } from '../src/client/analyzeTransactions';
import { getCoinjoinNetwork } from '../src/utils/settingsUtils';

const argvSlice = process.argv.slice(2);
const network = argvSlice[0] ?? '';
const descriptor = argvSlice[1] ?? '';

const CACHE_DIR = `${__dirname}/.cache`;
const CACHE_ACCOUNT_INFO = `${CACHE_DIR}/accountInfo.json`;
const CACHE_PARAMS = `${CACHE_DIR}/anonymityScoreParams.json`;

/**
 * Semi e2e test for debugging purposes
 *
 * NOTE: this test expects coinjoin-backend to be present, for the account discovery.
 * The scores themselves are computed in process by `@trezor/coinjoin-analysis`; nothing
 * is posted to a middleware on port 37128 any more.
 *
 * Usage:
 * `yarn workspace @trezor/coinjoin test:anonymity [COIN] [XPUB]`
 *
 * Result:
 * 1. Reads accountInfo using CoinjoinBackend
 * 2. Uses accountInfo to calculate anonymity scores locally
 * 3. stores both accountInfo and the analyzer's input in the `.cache` directory
 */

(async () => {
    console.log('✅', 'Start');

    // create cache directory
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR);
    }

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
    } catch {
        // do nothing
    }

    if (!cached) {
        const params = getAccountInfoParams(network, descriptor);
        const accountInfo = await getAccountInfo(params);
        transactions.push(...accountInfo.history.transactions);
        fs.writeFileSync(CACHE_ACCOUNT_INFO, JSON.stringify(accountInfo, null, 4));
    }

    const options = {
        network: getCoinjoinNetwork(network as any),
        logger: noopLogger,
    };

    // record exactly what the analyzer was fed, for debugging
    fs.writeFileSync(
        CACHE_PARAMS,
        JSON.stringify(getAnonymityScoresRequest(transactions, options), null, 4),
    );

    const anonScores = getAnonymityScores(transactions, options);

    console.log('✅', 'End, printing anonymity scores:');
    console.log(anonScores);
})();
