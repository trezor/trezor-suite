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
    Generators,
    type RealCredentialsRequestData,
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
 * The pinned binary's warm wall clock per call, in milliseconds.
 *
 * The plan's gate is "no more than ~2x the binary's wall clock per phase", and the
 * binary is gone from the tree, so the numbers it was measured at live here. How they
 * were taken, so that they can be retaken:
 *
 * - `WalletWasabi.WabiSabiClientLibrary`, `release/v15.0`, commit `34a0f983` (the
 *   version this port is frozen at, see `UPSTREAM`). The linux-x64 build is still in
 *   this repository's history as the LFS object
 *   `085eec737383e4bd70f35994c8b94537bf4dd2a54e06dd28a8d5eb7f5fa7f881`, which
 *   `git cat-file -p 40835eb133^:suite/app-assets/files/bin/coinjoin/linux-x64/WalletWasabi.WabiSabiClientLibrary`
 *   points at; restore it, `chmod +x`, and run it with `WCL_BIND_PORT=37128`.
 * - Each endpoint was POSTed five times with the same inputs this tool uses, over
 *   localhost HTTP (a round trip the port does not pay, and about 1 ms of the figures
 *   below). The first call of each is discarded: like the port, the binary pays a
 *   one-off warm-up, and the gate is about the steady state of a round.
 * - Node 22, Linux x86-64, one machine. The ratio is what travels, not the absolute
 *   numbers — rerun both halves on the same machine before trusting a verdict.
 *
 * `get-credentials` does the same work whatever the credential width (two
 * issuer-parameters statements), so the amount figure is used for the vsize steps too.
 */
const BINARY_BASELINE_MS: Record<string, number> = {
    'zero amount request (width 0)': 3.5,
    'zero vsize request (width 0)': 2.9,
    'verify issued amount credentials': 5.5,
    'verify issued vsize credentials': 5.5,
    'real amount request (width 42)': 152.2,
    'real vsize request (width 8)': 15.8,
    'amount decomposition': 39.8,
    'output registration request (presentation only)': 7.5,
    'select inputs for round': 1.5,
    'anonymity scores (50 transactions)': 28.8,
};

/** The plan's budget: per phase, and for a single uninterrupted computation. */
const PHASE_RATIO_BUDGET = 2;
const SYNCHRONOUS_BUDGET_MS = 100;

interface Timing {
    phase: string;
    step: string;
    ms: number;
}

/**
 * Per-phase timing of the work that used to run inside the
 * `WalletWasabi.WabiSabiClientLibrary` binary and now runs in process.
 *
 * Why it matters: every figure here lands on the Electron main process event loop, which
 * also serves device IPC, so a phase that overruns its coordinator deadline shows up as
 * missed registrations and lost rounds rather than as an error. The credential requests
 * are driven through `createRequestWithYields`, the same way `src/client/credentials.ts`
 * drives them, and the longest stretch between two yields is reported as well — that is
 * the number the 100 ms budget is about, not the request total.
 */
const runPhases = async () => {
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

    const timings: Timing[] = [];
    const time = <T>(phase: string, step: string, fn: () => T): T => {
        const started = process.hrtime.bigint();
        const result = fn();
        timings.push({ phase, step, ms: Number(process.hrtime.bigint() - started) / 1e6 });

        return result;
    };

    // The longest stretch of uninterrupted computation seen inside a yielding request.
    let longestChunkMs = 0;
    let longestChunkStep = '';

    const timeWithYields = async (
        phase: string,
        step: string,
        request: (yieldToCaller: () => Promise<void>) => Promise<RealCredentialsRequestData>,
    ) => {
        const started = process.hrtime.bigint();
        let lastYield = started;
        let total = 0;
        const result = await request(async () => {
            const now = process.hrtime.bigint();
            const chunk = Number(now - lastYield) / 1e6;
            total += chunk;
            if (chunk > longestChunkMs) {
                longestChunkMs = chunk;
                longestChunkStep = step;
            }
            await new Promise<void>(resolve => setTimeout(resolve, 0));
            lastYield = process.hrtime.bigint();
        });
        // The time between yields, not the wall clock, which includes the event loop
        // turns this deliberately hands over.
        total += Number(process.hrtime.bigint() - lastYield) / 1e6;
        timings.push({ phase, step, ms: total });

        return result;
    };

    // Round trip through the wire format, as a real coordinator exchange does, then hand
    // the issuer's live response straight back to the client.
    const issue = (issuer: CredentialIssuer, request: unknown) =>
        issuer.handleRequest(
            deserializeCredentialsRequest(serializeCredentialsRequest(request as never)),
        );

    /**
     * The two null requests a phase opens with, and the credentials they yield.
     *
     * `verifyIssued` mirrors what the client actually does with the answer: input
     * registration and the reissuance in output registration turn the issued zero
     * credentials into credentials they go on to present, while the connection
     * confirmation ignores the ones it is handed (see `connectionConfirmation.ts`), so
     * its phase pays for the requests only.
     */
    const nullRequests = (phase: string, verifyIssued = true) => {
        const zeroAmount = time(phase, 'zero amount request (width 0)', () =>
            amountClient.createRequestForZeroAmount(),
        );
        const zeroVsize = time(phase, 'zero vsize request (width 0)', () =>
            vsizeClient.createRequestForZeroAmount(),
        );
        if (!verifyIssued) {
            return { amountCredentials: [], vsizeCredentials: [] };
        }
        const zeroAmountIssued = issue(amountIssuer, zeroAmount.credentialsRequest);
        const zeroVsizeIssued = issue(vsizeIssuer, zeroVsize.credentialsRequest);
        const amountCredentials: Credential[] = time(
            phase,
            'verify issued amount credentials',
            () =>
                amountClient.handleResponse(
                    zeroAmountIssued,
                    zeroAmount.credentialsResponseValidation,
                ),
        );
        const vsizeCredentials: Credential[] = time(phase, 'verify issued vsize credentials', () =>
            vsizeClient.handleResponse(zeroVsizeIssued, zeroVsize.credentialsResponseValidation),
        );

        return { amountCredentials, vsizeCredentials };
    };

    // Phase 0, input registration: two null requests, then two real requests against the
    // credentials they get back.
    const registration = nullRequests('phase 0');
    const realAmount = await timeWithYields('phase 0', 'real amount request (width 42)', yieldTo =>
        amountClient.createRequestWithYields(
            [1_000_000, 0],
            registration.amountCredentials,
            yieldTo,
        ),
    );
    const realVsize = await timeWithYields('phase 0', 'real vsize request (width 8)', yieldTo =>
        vsizeClient.createRequestWithYields([197, 0], registration.vsizeCredentials, yieldTo),
    );

    const realAmountIssued = issue(amountIssuer, realAmount.credentialsRequest);
    const realVsizeIssued = issue(vsizeIssuer, realVsize.credentialsRequest);

    // Phase 1, connection confirmation: another pair of null requests for the ping, and
    // the client verifies the real credentials it is issued.
    nullRequests('phase 1', false);
    const confirmedAmount = time('phase 1', 'verify issued amount credentials', () =>
        amountClient.handleResponse(realAmountIssued, realAmount.credentialsResponseValidation),
    );
    const confirmedVsize = time('phase 1', 'verify issued vsize credentials', () =>
        vsizeClient.handleResponse(realVsizeIssued, realVsize.credentialsResponseValidation),
    );

    // Phase 2, output registration: amount decomposition, one reissuance to split the
    // confirmed credentials into an output and its change, then a presentation-only
    // request per output.
    const outputAmounts = time('phase 2', 'amount decomposition', () =>
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

    const reissuedAmount = await timeWithYields(
        'phase 2',
        'real amount request (width 42)',
        yieldTo =>
            amountClient.createRequestWithYields(
                [500_000, confirmedAmount[0]!.value - 500_000],
                confirmedAmount,
                yieldTo,
            ),
    );
    const reissuedVsize = await timeWithYields('phase 2', 'real vsize request (width 8)', yieldTo =>
        vsizeClient.createRequestWithYields(
            [43, confirmedVsize[0]!.value - 43],
            confirmedVsize,
            yieldTo,
        ),
    );
    const reissuanceNull = nullRequests('phase 2');
    // The issuer's side of the reissuance is the coordinator's work, so it is done
    // before the clock starts: verifying a width-42 range proof costs it as much as
    // producing one costs us, and timing it here would measure the mock coordinator.
    const reissuedAmountIssued = issue(amountIssuer, reissuedAmount.credentialsRequest);
    const reissuedVsizeIssued = issue(vsizeIssuer, reissuedVsize.credentialsRequest);
    const outputAmountCredentials = time('phase 2', 'verify issued amount credentials', () =>
        amountClient.handleResponse(
            reissuedAmountIssued,
            reissuedAmount.credentialsResponseValidation,
        ),
    );
    const outputVsizeCredentials = time('phase 2', 'verify issued vsize credentials', () =>
        vsizeClient.handleResponse(
            reissuedVsizeIssued,
            reissuedVsize.credentialsResponseValidation,
        ),
    );
    await timeWithYields('phase 2', 'output registration request (presentation only)', yieldTo =>
        amountClient.createRequestWithYields([], outputAmountCredentials, yieldTo),
    );
    await timeWithYields('phase 2', 'output registration request (presentation only)', yieldTo =>
        vsizeClient.createRequestWithYields([], outputVsizeCredentials, yieldTo),
    );
    void reissuanceNull;

    // Round selection, once per round candidate per account.
    time('selection', 'select inputs for round', () =>
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
    time('sync', 'anonymity scores (50 transactions)', () => getAnonymityScores(history));

    return { timings, outputAmounts, longestChunkMs, longestChunkStep };
};

const benchmarkPhases = async () => {
    // `CoinjoinClient.enable()` builds the precomputed tables before any round runs, so
    // the cold pass below is measured the same way: after the warm-up, not instead of
    // it. Without it the first credential request pays about 380 ms for the tables in
    // one uninterrupted stretch.
    const warmUpStarted = process.hrtime.bigint();
    let longestWarmUpChunk = 0;
    let lastChunk = warmUpStarted;
    await Generators.warmUp(async () => {
        longestWarmUpChunk = Math.max(
            longestWarmUpChunk,
            Number(process.hrtime.bigint() - lastChunk) / 1e6,
        );
        await new Promise<void>(resolve => setTimeout(resolve, 0));
        lastChunk = process.hrtime.bigint();
    });
    const warmUpMs = Number(process.hrtime.bigint() - warmUpStarted) / 1e6;

    // The first pass through a process still pays for the JIT; a round in a running
    // Suite does not. Both are reported, and the budget is checked against the warm one.
    const cold = await runPhases();
    const warm = await runPhases();

    console.log(
        `\nGenerator warm-up (at client enable, not in a round): ${warmUpMs.toFixed(1)} ms,`,
        `longest uninterrupted stretch ${longestWarmUpChunk.toFixed(1)} ms`,
    );

    const total = (timings: Timing[]) => timings.reduce((sum, { ms }) => sum + ms, 0);

    console.log('\n', '✅', 'Per-phase local computation');
    console.log(`Decomposed to ${warm.outputAmounts.length} outputs.`);
    console.log('phase\tstep\twarm ms\tcold ms\tbinary ms\tratio');
    warm.timings.forEach(({ phase, step, ms }, index) => {
        const coldMs = cold.timings[index]?.ms ?? NaN;
        const baseline = BINARY_BASELINE_MS[step];
        const ratio = baseline === undefined ? '' : `${(ms / baseline).toFixed(2)}x`;
        console.log(
            `${phase}\t${step}\t${ms.toFixed(1)}\t${coldMs.toFixed(1)}\t${
                baseline?.toFixed(1) ?? '?'
            }\t${ratio}`,
        );
    });

    console.log('\nPer phase, against the binary:');
    const phases = [...new Set(warm.timings.map(({ phase }) => phase))];
    const overBudget: string[] = [];
    phases.forEach(phase => {
        const steps = warm.timings.filter(timing => timing.phase === phase);
        const measured = total(steps);
        const baseline = steps.reduce((sum, { step }) => sum + (BINARY_BASELINE_MS[step] ?? 0), 0);
        const ratio = measured / baseline;
        if (ratio > PHASE_RATIO_BUDGET) {
            overBudget.push(`${phase} (${ratio.toFixed(2)}x)`);
        }
        console.log(
            `${phase}\t${measured.toFixed(1)} ms\tbinary ${baseline.toFixed(1)} ms\t${ratio.toFixed(2)}x`,
        );
    });

    if (overBudget.length > 0) {
        console.log(
            `\n⚠️  ${overBudget.length} phase(s) over the ${PHASE_RATIO_BUDGET}x budget:`,
            overBudget.join(', '),
        );
    } else {
        console.log(`\n✅ Every phase is inside the ${PHASE_RATIO_BUDGET}x budget.`);
    }

    console.log(
        `\nLongest computation between two yields: ${warm.longestChunkMs.toFixed(1)} ms`,
        `(${warm.longestChunkStep}); cold ${cold.longestChunkMs.toFixed(1)} ms`,
    );
    if (warm.longestChunkMs > SYNCHRONOUS_BUDGET_MS) {
        console.log(
            `⚠️  over the ${SYNCHRONOUS_BUDGET_MS} ms budget for a single synchronous`,
            'computation. The event loop is handed back between proofs; see',
            '`proveWithYields` in @trezor/wabisabi-crypto.',
        );
    } else {
        console.log(`✅ Inside the ${SYNCHRONOUS_BUDGET_MS} ms single-computation budget.`);
    }

    // A step that is not a credential request has no yield inside it, so its own figure
    // is a single synchronous computation.
    const longSync = warm.timings.filter(
        ({ step, ms }) => !step.includes('request') && ms > SYNCHRONOUS_BUDGET_MS,
    );
    if (longSync.length > 0) {
        console.log(
            `⚠️  ${longSync.length} step(s) with no yield inside them over`,
            `${SYNCHRONOUS_BUDGET_MS} ms:`,
            longSync.map(({ step }) => step).join(', '),
        );
    }
};

(async () => {
    stripHeaders();

    await benchmarkPhases();

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
