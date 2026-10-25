/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

import http from 'http';
import https from 'https';
import net from 'net';
import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import WebSocket from 'ws';

import { getAnonymityScores } from '@trezor/coinjoin-analysis';
import { getOutputAmounts, selectInputsForRound } from '@trezor/coinjoin-strategy';
import {
    type Credential,
    WabiSabiClient,
    deserializeCredentialsRequest,
    secureRandom,
    serializeCredentialsRequest,
} from '@trezor/wabisabi-crypto';
import { CredentialIssuer, CredentialIssuerSecretKey } from '@trezor/wabisabi-crypto/src/testing';

// The public wasabiwallet.io coordinator shut down, so the host to compare blockbook against has
// to be passed in via the WASABI_URL env variable; without it only the blockbook half runs.
const { WASABI_URL } = process.env;
const BLOCKBOOK_URL = 'wss://staging-btc.trezor.io/websocket';
const TIMEOUT = 20000;

const benchmarkArgs = process.argv.slice(2);
const bestKnownHash = benchmarkArgs[0] ?? '';
const batchSizeString = benchmarkArgs[1] ?? '500';
const torSocket = benchmarkArgs[2] ?? '';
const batchSize = Number(batchSizeString);
const [host, port] = torSocket.split(':');
const agent = host && port ? new SocksProxyAgent(`socks://${host}:${port}`) : undefined;

// Copied from request-manager to remove disallowed headers because of Wasabi
const stripHeaders = () => {
    const originalSocketWrite = net.Socket.prototype.write;
    net.Socket.prototype.write = function (data, ...args) {
        const overloadedHeaders: string[] = [];
        if (typeof data === 'string' && /Allowed-Headers/gi.test(data)) {
            const headers = data.split('\r\n');
            const allowedHeaders = headers
                .find(line => /^Allowed-Headers/i.test(line))
                ?.split(': ');

            if (allowedHeaders) {
                const allowedValue = allowedHeaders[1] ?? '';
                const allowedKeys = allowedValue.split(';');

                headers.forEach(line => {
                    const [key, value] = line.split(': ');
                    if (key && value) {
                        if (allowedKeys.some(allowed => new RegExp(`^${allowed}`, 'i').test(key))) {
                            overloadedHeaders.push(line);
                        }
                    } else {
                        overloadedHeaders.push(line);
                    }
                });
            }
        }

        return originalSocketWrite.apply(this, [
            overloadedHeaders.length > 0 ? overloadedHeaders.join('\r\n') : data,
            ...args,
        ] as unknown as Parameters<typeof originalSocketWrite>);
    };
};

let bytes = 0;

const origHttpsRequest = https.request;
https.request = (...args) => {
    const response = origHttpsRequest(...(args as Parameters<typeof origHttpsRequest>));
    response.on('response', res => {
        res.on('data', (data: Buffer) => (bytes += data.byteLength));
    });

    return response;
};

const origHttpRequest = http.request;
http.request = (...args) => {
    const response = origHttpRequest(...(args as Parameters<typeof origHttpRequest>));
    response.on('response', res => {
        res.on('data', (data: Buffer) => (bytes += data.byteLength));
    });

    return response;
};

const log = (hash: string, compressed: number, uncompressed: number) => {
    console.log(`${hash}\t${compressed}\t${uncompressed}`);
};

const filtersFromWasabi = async (baseUrl: string, hash: string) => {
    bytes = 0;
    const response = await fetch(
        `${baseUrl}/api/v4/btc/Blockchain/filters?bestKnownBlockHash=${hash}&count=${batchSize}`,
        {
            agent,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept-Encoding': 'br',
                'Allowed-Headers': 'Accept-Encoding;Content-Type;Content-Length;Host',
            },
        },
    );

    if (response.status === 204) return [];
    if (response.status === 200) {
        const buffer = await response.buffer();
        const { filters }: { filters: string[] } = JSON.parse(buffer.toString());
        log(hash, bytes, buffer.byteLength);

        return filters.map(data => {
            const [_blockHeight, blockHash, _filter, _prevHash, _blockTime] = data.split(':');

            return blockHash;
        });
    }
    throw new Error(`${response.status} ${response.statusText}`);
};

const getWebsocket = async () => {
    const ws = new WebSocket(BLOCKBOOK_URL, {
        agent,
        perMessageDeflate: true,
        headers: {
            'User-Agent': 'Trezor Suite',
        },
    });

    await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), TIMEOUT);
        ws.once('error', error => reject(error));
        ws.once('open', () => {
            clearTimeout(timeout);
            ws.removeAllListeners();
            resolve();
        });
    });

    let compressed = 0;

    (ws as any)._socket.on('data', (chunk: Buffer) => (compressed += chunk.byteLength));

    let messageID = 0;

    return (bestKnownBlockHash: string) => {
        compressed = 0;
        const reqID = (messageID++).toString();

        return new Promise<string[]>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('timeout')), TIMEOUT);
            ws.once('message', (message: string) => {
                log(bestKnownBlockHash, compressed, message.length);
                clearTimeout(timeout);
                const resp = JSON.parse(message);
                const {
                    id,
                    data: { error, blockFiltersBatch },
                } = resp;
                if (reqID !== id || error) {
                    reject(new Error(`Error ${id} ${reqID} ${error.message}`));
                } else {
                    resolve(blockFiltersBatch.map((row: string) => row.split(':')[1]));
                }
            });
            ws.send(
                JSON.stringify({
                    id: reqID,
                    method: 'getBlockFiltersBatch',
                    params: {
                        bestKnownBlockHash,
                        pageSize: batchSize,
                        scriptType: 'taproot-noordinals',
                    },
                }),
            );
        });
    };
};

/**
 * Per-phase timing of the work that used to run inside the
 * `WalletWasabi.WabiSabiClientLibrary` binary and now runs in process.
 *
 * There is no longer a binary in the tree to compare against, so this reports absolute
 * numbers rather than a ratio. What the numbers are for: every figure here lands on the
 * Electron main process event loop, which also serves device IPC, so a phase that
 * overruns its coordinator deadline shows up as missed registrations and lost rounds
 * rather than as an error. See the yield points in `src/client/credentials.ts`.
 */
const benchmarkPhases = () => {
    // Mainnet round parameters: a 42-bit range proof per amount credential, 8-bit per
    // vsize credential.
    const MAX_AMOUNT_CREDENTIAL_VALUE = 4_300_000_000_000;
    const MAX_VSIZE_ALLOCATION_PER_ALICE = 255;
    const MINING_FEE_RATE = 129_000;

    const amountKey = CredentialIssuerSecretKey.fromRandom(secureRandom);
    const vsizeKey = CredentialIssuerSecretKey.fromRandom(secureRandom);
    const amountIssuer = new CredentialIssuer(amountKey, secureRandom, MAX_AMOUNT_CREDENTIAL_VALUE);
    const vsizeIssuer = new CredentialIssuer(
        vsizeKey,
        secureRandom,
        MAX_VSIZE_ALLOCATION_PER_ALICE,
    );
    const amountClient = new WabiSabiClient(
        amountKey.computeCredentialIssuerParameters(),
        secureRandom,
        MAX_AMOUNT_CREDENTIAL_VALUE,
    );
    const vsizeClient = new WabiSabiClient(
        vsizeKey.computeCredentialIssuerParameters(),
        secureRandom,
        MAX_VSIZE_ALLOCATION_PER_ALICE,
    );

    const timings: { step: string; ms: number }[] = [];
    const time = <T>(step: string, fn: () => T): T => {
        const started = process.hrtime.bigint();
        const result = fn();
        timings.push({ step, ms: Number(process.hrtime.bigint() - started) / 1e6 });

        return result;
    };

    // Round trip through the wire format, as a real coordinator exchange does, then hand
    // the issuer's live response straight back to the client.
    const issue = (issuer: CredentialIssuer, request: unknown) =>
        issuer.handleRequest(
            deserializeCredentialsRequest(serializeCredentialsRequest(request as never)),
        );

    // Phase 0, input registration: two null requests, then two real requests against the
    // credentials they get back.
    const zeroAmount = time('phase 0  zero amount request (width 0)', () =>
        amountClient.createRequestForZeroAmount(),
    );
    const zeroVsize = time('phase 0  zero vsize request (width 0)', () =>
        vsizeClient.createRequestForZeroAmount(),
    );
    const zeroAmountIssued = issue(amountIssuer, zeroAmount.credentialsRequest);
    const zeroVsizeIssued = issue(vsizeIssuer, zeroVsize.credentialsRequest);
    const amountCredentials: Credential[] = time(
        'phase 0  verify issued zero amount credentials',
        () =>
            amountClient.handleResponse(zeroAmountIssued, zeroAmount.credentialsResponseValidation),
    );
    const vsizeCredentials: Credential[] = time(
        'phase 0  verify issued zero vsize credentials',
        () => vsizeClient.handleResponse(zeroVsizeIssued, zeroVsize.credentialsResponseValidation),
    );

    const realAmount = time('phase 0  real amount request (width 42)', () =>
        amountClient.createRequest([1_000_000, 0], amountCredentials),
    );
    const realVsize = time('phase 0  real vsize request (width 8)', () =>
        vsizeClient.createRequest([197, 0], vsizeCredentials),
    );

    const realAmountIssued = issue(amountIssuer, realAmount.credentialsRequest);
    const realVsizeIssued = issue(vsizeIssuer, realVsize.credentialsRequest);

    // Phase 1, connection confirmation: the client verifies what it was issued.
    const confirmedAmount = time('phase 1  verify issued amount credentials', () =>
        amountClient.handleResponse(realAmountIssued, realAmount.credentialsResponseValidation),
    );
    time('phase 1  verify issued vsize credentials', () =>
        vsizeClient.handleResponse(realVsizeIssued, realVsize.credentialsResponseValidation),
    );

    // Phase 2, output registration: amount decomposition, then a presentation-only
    // request per output.
    const outputAmounts = time('phase 2  amount decomposition', () =>
        getOutputAmounts(
            {
                InternalAmounts: [1_000_000, 2_000_000],
                ExternalAmounts: Array.from({ length: 30 }, (_, i) => 1_000_000 + i * 17),
                InputSize: 58,
                OutputSize: 43,
                AvailableVsize: 394,
                MiningFeeRate: MINING_FEE_RATE,
                AllowedOutputAmounts: { Min: 5000, Max: MAX_AMOUNT_CREDENTIAL_VALUE },
            },
            secureRandom,
        ),
    );
    time('phase 2  output registration request (presentation only)', () =>
        amountClient.createRequest([], confirmedAmount),
    );

    // Round selection, once per round candidate per account.
    time('selection  select inputs for round', () =>
        selectInputsForRound(
            {
                AllowedInputAmounts: { Min: 5000, Max: MAX_AMOUNT_CREDENTIAL_VALUE },
                AllowedOutputAmounts: { Min: 5000, Max: MAX_AMOUNT_CREDENTIAL_VALUE },
                CoordinationFeeRate: { Rate: 0.003, PlebsDontPayThreshold: 1_000_000 },
                MiningFeeRate: MINING_FEE_RATE,
                AllowedInputTypes: ['P2WPKH', 'Taproot'],
                Utxos: Array.from({ length: 12 }, (_, i) => ({
                    Outpoint: `${i.toString(16).padStart(2, '0').repeat(32)}00000000`,
                    Amount: 1_000_000 + i * 100_000,
                    ScriptPubKey: `5120${i.toString(16).padStart(2, '0').repeat(32)}`,
                    AnonymitySet: 1,
                })),
                AnonScoreTarget: 5,
                SemiPrivateThreshold: 2,
                LiquidityClue: MAX_AMOUNT_CREDENTIAL_VALUE,
                ConsolidationMode: false,
            },
            secureRandom,
        ),
    );

    // Account sync: anonymity scoring over a synthetic history, newest first as Suite
    // sends it — transaction `i` spends the output transaction `i + 1` created.
    const history = Array.from({ length: 50 }, (_, i) => ({
        InternalInputs: i === 49 ? [] : [{ Address: `own-${i + 1}`, Value: 1_000_000 }],
        ExternalInputs: Array.from({ length: 9 }, () => ({
            ScriptPubKey: `0014${'ab'.repeat(20)}`,
            Value: 1_000_000,
        })),
        InternalOutputs: [{ Address: `own-${i}`, Value: 20_000 }],
        ExternalOutputs: Array.from({ length: 9 }, (_, j) => ({
            ScriptPubKey: `5120${j.toString(16).padStart(2, '0').repeat(32)}`,
            Value: 20_000,
        })),
    }));
    time('sync  anonymity scores (50 transactions)', () => getAnonymityScores(history));

    console.log('\n', '✅', 'Per-phase local computation');
    console.log(`Decomposed to ${outputAmounts.length} outputs.`);
    timings.forEach(({ step, ms }) => console.log(`${step}\t${ms.toFixed(1)} ms`));
    const overBudget = timings.filter(({ ms }) => ms > 100);
    if (overBudget.length > 0) {
        console.log(
            `\n⚠️  ${overBudget.length} step(s) over the 100 ms budget for a single`,
            'synchronous computation:',
            overBudget.map(({ step }) => step).join(', '),
        );
        console.log(
            'Callers must keep a yield point around these; see',
            '`yieldToEventLoop` in src/client/credentials.ts.',
        );
    }
};

(async () => {
    stripHeaders();

    benchmarkPhases();

    if (WASABI_URL) {
        console.log('✅', 'Start Wasabi benchmark');

        console.time('Wasabi filters');

        let wasabiBatch = await filtersFromWasabi(WASABI_URL, bestKnownHash);
        while (wasabiBatch.length === batchSize) {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const lastItem: string = wasabiBatch[batchSize - 1];
            wasabiBatch = await filtersFromWasabi(WASABI_URL, lastItem);
        }

        console.timeEnd('Wasabi filters');
    } else {
        console.log('⏭️', 'Skipping Wasabi benchmark, set WASABI_URL to run it');
    }

    console.log('\n', '✅', 'Start Blockbook benchmark');

    console.time('Blockbook filters');

    const filtersFromBlockbook = await getWebsocket();

    let batch = await filtersFromBlockbook(bestKnownHash);
    while (batch.length === batchSize) {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const lastItem: string = batch[batchSize - 1];
        batch = await filtersFromBlockbook(lastItem);
    }

    console.timeEnd('Blockbook filters');

    console.log('✅', 'End');
})();
