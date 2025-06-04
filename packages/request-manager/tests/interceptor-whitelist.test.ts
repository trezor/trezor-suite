import net, { Socket } from 'net';
import nodeFetch from 'node-fetch';
import tls, { TLSSocket } from 'tls';
import WebSocket from 'ws';

import { createInterceptor } from '../src';
import { InterceptorOptions } from '../src/types';

const WHITELISTED_DOMAIN = 'url-that-is-valid-and-white-listed-but-does-not-exists.com';
const NOT_WHITELISTED_DOMAIN = 'not-white-listed-but-does-not-exists.com';

const OK_ERROR_SHORT = `getaddrinfo ENOTFOUND ${WHITELISTED_DOMAIN}`;
const OK_ERROR_HTTPS = new RegExp(`.*${OK_ERROR_SHORT}`);

const createWebSocket = (url: string) =>
    new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(url, {
            headers: { 'User-Agent': 'Trezor Suite' },
        });
        ws.on('open', () => {
            ws.close();
            resolve();
        });
        ws.on('error', reject);
    });

type AnySocket = Socket | TLSSocket;

const promisifySocket = <T extends AnySocket>(host: string, port: number, socket: T) =>
    new Promise<Socket>((resolve, reject) => {
        const errorHandler = (err: Error) => reject(err);
        socket.on('error', errorHandler);
        socket.connect(port, host, () => resolve(socket));
    });

const openTcpSocket = (host: string, port: number) => promisifySocket(host, port, new Socket());

const openTlsSocket = (host: string, port: number) =>
    promisifySocket(host, port, new Socket(null as any /* TODO omg why? */));

const openNetSocket = (host: string, port: number) => promisifySocket(host, port, new net.Socket());

const performNetConnect = (host: string, port: number) =>
    new Promise<Socket>((resolve, reject) => {
        const socket = net.connect(port, host);
        socket.on('error', (err: Error) => reject(err));
        socket.on('connect', () => resolve(socket));
    });

const performTlsConnect = (host: string, port: number) =>
    new Promise<Socket>((resolve, reject) => {
        const socket = tls.connect(port, host);
        socket.on('error', (err: Error) => reject(err));
        socket.on('connect', () => resolve(socket));
    });

describe('Interceptor', () => {
    const torSettings = { running: false };

    const interceptorOptions: InterceptorOptions = {
        getWhitelistedDomains: () => [WHITELISTED_DOMAIN],
        handler: () => {},
        getTorSettings: () => torSettings,
    };

    beforeAll(() => {
        createInterceptor(interceptorOptions);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('Blocks websocket connections', async () => {
        await expect(createWebSocket(`wss://${WHITELISTED_DOMAIN}/websocket`)).rejects.toThrow(
            OK_ERROR_SHORT,
        );

        await expect(createWebSocket(`wss://${NOT_WHITELISTED_DOMAIN}/websocket`)).rejects.toThrow(
            `Request blocked, not whitelisted domain: ${NOT_WHITELISTED_DOMAIN}`,
        );
    });

    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
        it(`Blocks all not whitelisted node-fetch requests for: ${method}`, async () => {
            await expect(nodeFetch(`https://${WHITELISTED_DOMAIN}`, { method })).rejects.toThrow(
                OK_ERROR_HTTPS,
            );

            await expect(
                nodeFetch(`https://${NOT_WHITELISTED_DOMAIN}`, { method }),
            ).rejects.toThrow(`Request blocked, not whitelisted domain: ${NOT_WHITELISTED_DOMAIN}`);
        });
    });

    it('Blocks the TCP connection', async () => {
        await expect(async () =>
            (await openTcpSocket(WHITELISTED_DOMAIN, 80)).end(),
        ).rejects.toThrow(OK_ERROR_SHORT);

        await expect(openTcpSocket(NOT_WHITELISTED_DOMAIN, 80)).rejects.toThrow(
            `Request blocked, not whitelisted domain: ${NOT_WHITELISTED_DOMAIN}`,
        );
    });

    it('Blocks the TLS connection', async () => {
        await expect(async () =>
            (await openTlsSocket(WHITELISTED_DOMAIN, 80)).end(),
        ).rejects.toThrow(OK_ERROR_SHORT);

        await expect(openTlsSocket(NOT_WHITELISTED_DOMAIN, 80)).rejects.toThrow(
            `Request blocked, not whitelisted domain: ${NOT_WHITELISTED_DOMAIN}`,
        );
    });

    it('Blocks net.Socket', async () => {
        await expect(async () =>
            (await openNetSocket(WHITELISTED_DOMAIN, 80)).end(),
        ).rejects.toThrow(OK_ERROR_SHORT);

        await expect(openNetSocket(NOT_WHITELISTED_DOMAIN, 80)).rejects.toThrow(
            `Request blocked, not whitelisted domain: ${NOT_WHITELISTED_DOMAIN}`,
        );
    });

    it('Blocks net.connect', async () => {
        await expect(async () =>
            (await performNetConnect(WHITELISTED_DOMAIN, 80)).end(),
        ).rejects.toThrow(OK_ERROR_SHORT);

        try {
            await performNetConnect(NOT_WHITELISTED_DOMAIN, 80);
            expect('').toBe('Should throw an error');
        } catch (error) {
            expect(error.message).toBe(
                `Request blocked, not whitelisted domain: ${NOT_WHITELISTED_DOMAIN}`,
            );
        }
    });

    it('Blocks tls.connect', async () => {
        await expect(async () =>
            (await performTlsConnect(WHITELISTED_DOMAIN, 80)).end(),
        ).rejects.toThrow(OK_ERROR_SHORT);

        try {
            await performTlsConnect(NOT_WHITELISTED_DOMAIN, 80);
            expect('').toBe('Should throw an error');
        } catch (error) {
            expect(error.message).toBe(
                `Request blocked, not whitelisted domain: ${NOT_WHITELISTED_DOMAIN}`,
            );
        }
    });

    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].forEach(method => {
        it(`Blocks all not whitelisted native fetch for: ${method}`, async () => {
            await expect(fetch(`https://${WHITELISTED_DOMAIN}`, { method })).rejects.toThrow(
                'fetch failed',
            );

            try {
                await fetch(`https://${NOT_WHITELISTED_DOMAIN}/`, { method });
                expect('').toBe('Should throw an error');
            } catch (error) {
                expect(error.message).toBe(
                    `Request blocked, not whitelisted domain: ${NOT_WHITELISTED_DOMAIN}`,
                );
            }
        });
    });
});
