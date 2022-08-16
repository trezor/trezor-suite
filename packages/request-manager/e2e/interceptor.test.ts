import path from 'path';
import fetch from 'node-fetch';

import { TorController, createInterceptor } from '../src';
import { torRunner } from './torRunner';
import { TorIdentities } from '../src/torIdentities';

const host = 'localhost';
const port = 38835;
const controlPort = 35527;
const processId = process.pid;

// 1 minute before timeout, because Tor might be slow to start.
jest.setTimeout(60000);

// Because tmp/control_auth_cookie is shared by other tests, this test should not run in parallel
// using `--runInBand` option with jest.
const authFilePath = path.join(__dirname, 'tmp');
const ipRegex = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;

const testGetUrlHttp = 'http://check.torproject.org/';
const testGetUrlHttps = 'https://check.torproject.org/';
const testPostUrlHttps = 'https://httpbin.org/post';

describe('Interceptor', () => {
    let torProcess: any;
    let torController: any;

    beforeAll(async () => {
        // Callback in in createInterceptor should return true in order for the request to use Tor.
        createInterceptor({
            handler: () => {},
            getIsTorEnabled: () => true,
        });
        // Starting Tor controller to make sure that Tor is running.
        torController = new TorController({
            host,
            port,
            controlPort,
            authFilePath,
        });
        const torParams = torController.getTorConfiguration(processId);
        // Starting Tor process from binary.
        torProcess = torRunner({
            torParams,
        });

        TorIdentities.init(torController);
        // Waiting for Tor to be ready to accept successful connections.
        await torController.waitUntilAlive();
    });

    afterAll(async () => {
        if (torProcess) {
            await torProcess.kill();
            torProcess = null;
        }
    });

    describe('GET method', () => {
        it('HTTP - When no identity is provided, default identity is used', async () => {
            const identityDefault = await fetch(testGetUrlHttp, {
                headers: { 'User-Agent': 'identity:default' },
            });
            const identityDefault2 = await fetch(testGetUrlHttp);
            const iPIdentitieA = ((await identityDefault.text()) as any).match(ipRegex)[0];
            const iPIdentitieA2 = ((await identityDefault2.text()) as any).match(ipRegex)[0];
            expect(iPIdentitieA).toEqual(iPIdentitieA2);
        });

        it('HTTPS - When no identity is provided, default identity is used', async () => {
            const identityDefault = await fetch(testGetUrlHttps, {
                headers: { 'User-Agent': 'identity:default' },
            });
            const identityDefault2 = await fetch(testGetUrlHttps);
            const iPIdentitieA = ((await identityDefault.text()) as any).match(ipRegex)[0];
            const iPIdentitieA2 = ((await identityDefault2.text()) as any).match(ipRegex)[0];
            expect(iPIdentitieA).toEqual(iPIdentitieA2);
        });

        it('HTTPS - Each identity has different ip address', async () => {
            const identityA = await fetch(testGetUrlHttps, {
                headers: { 'User-Agent': 'identity:default' },
            });
            const identityB = await fetch(testGetUrlHttps, {
                headers: { 'User-Agent': 'identity:user' },
            });
            const identityA2 = await fetch(testGetUrlHttps, {
                headers: { 'User-Agent': 'identity:default' },
            });
            // Parsing IP address from html provided by check.torproject.org.
            const iPIdentitieA = ((await identityA.text()) as any).match(ipRegex)[0];
            const iPIdentitieB = ((await identityB.text()) as any).match(ipRegex)[0];
            const iPIdentitieA2 = ((await identityA2.text()) as any).match(ipRegex)[0];
            // Check if identities are the same when using same identity.
            expect(iPIdentitieA).toEqual(iPIdentitieA2);
            // Check if identities are different when using different identity.
            expect(iPIdentitieA).not.toEqual(iPIdentitieB);
        });
    });

    describe('POST method', () => {
        it('HTTPS - Each identity has different ip address', async () => {
            const identityA = await fetch(testPostUrlHttps, {
                method: 'POST',
                body: JSON.stringify({ test: 'test' }),
                headers: { 'User-Agent': 'identity:default' },
            });
            const identityB = await fetch(testPostUrlHttps, {
                method: 'POST',
                body: JSON.stringify({ test: 'test' }),
                headers: { 'User-Agent': 'identity:user' },
            });
            const identityA2 = await fetch(testPostUrlHttps, {
                method: 'POST',
                body: JSON.stringify({ test: 'test' }),
                headers: { 'User-Agent': 'identity:default' },
            });

            const iPIdentitieA = ((await identityA.json()) as any).origin;
            const iPIdentitieB = ((await identityB.json()) as any).origin;
            const iPIdentitieA2 = ((await identityA2.json()) as any).origin;

            // Check if identities are the same when using same identity.
            expect(iPIdentitieA).toEqual(iPIdentitieA2);
            // Check if identities are different when using different identity.
            expect(iPIdentitieA).not.toEqual(iPIdentitieB);
        });
    });
});
