/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

import net from 'net';
import http from 'http';
import https from 'https';
import fetch from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';
import WebSocket from 'ws';

const WASABI_URL = 'https://wasabiwallet.io';
const BLOCKBOOK_URL = 'wss://staging-btc.trezor.io/websocket';
const TIMEOUT = 20000;

const [bestKnownHash, batchSizeString = '500', torSocket = ''] = process.argv.slice(2);
const batchSize = Number(batchSizeString);
const [host, port] = torSocket.split(':');
const agent = host && port ? new SocksProxyAgent({ host, port }) : undefined;

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
                const allowedKeys = allowedHeaders[1].split(';');

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

const filtersFromWasabi = async (hash: string) => {
    bytes = 0;
    const response = await fetch(
        `${WASABI_URL}/api/v4/btc/Blockchain/filters?bestKnownBlockHash=${hash}&count=${batchSize}`,
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
            Origin: 'https://node.trezor.io',
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

(async () => {
    stripHeaders();

    console.log('✅', 'Start Wasabi benchmark');

    console.time('Wasabi filters');

    let batch = await filtersFromWasabi(bestKnownHash);
    while (batch.length === batchSize) {
        batch = await filtersFromWasabi(batch[batchSize - 1]);
    }

    console.timeEnd('Wasabi filters');

    console.log('\n', '✅', 'Start Blockbook benchmark');

    console.time('Blockbook filters');

    const filtersFromBlockbook = await getWebsocket();

    batch = await filtersFromBlockbook(bestKnownHash);
    while (batch.length === batchSize) {
        batch = await filtersFromBlockbook(batch[batchSize - 1]);
    }

    console.timeEnd('Blockbook filters');

    console.log('✅', 'End');
})();
