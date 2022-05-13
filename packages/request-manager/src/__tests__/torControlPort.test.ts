import util from 'util';
import path from 'path';
import fs from 'fs';
import net, { Socket } from 'net';

import type { TorConnectionOptions } from '../types';
import { createHmacSignature, getCookieString, TorControlPort } from '../torControlPort';

const writeFile = util.promisify(fs.writeFile);
const existsDirectory = util.promisify(fs.exists);
const mkdir = util.promisify(fs.mkdir);
const unlinkFile = util.promisify(fs.unlink);

const authFilePath = path.join(__dirname, 'tmp');
const controlAuthCookiePath = `${authFilePath}/control_auth_cookie`;
const host = 'localhost';
const port = 9998;
const controlPort = 9999;

describe('TorControlPort', () => {
    beforeAll(async () => {
        if (!(await existsDirectory(authFilePath))) {
            // Make sure there is `authFilePath` directory.
            mkdir(authFilePath);
        }
        await writeFile(controlAuthCookiePath, 'test');
    });

    afterAll(async () => {
        await unlinkFile(controlAuthCookiePath);
    });

    describe('TorControlPort is not connected', () => {
        it('TorControlPort ping should return false when TOR is not running', () => {
            const options: TorConnectionOptions = {
                host,
                port,
                controlPort,
                authFilePath,
            };
            const fakeListener = () => {};
            const torControlPort = new TorControlPort(options, fakeListener);
            const pingResponse = torControlPort.ping();
            expect(pingResponse).toEqual(false);
        });
    });

    describe('TorControlPort should authorize when connecting', () => {
        it('Tor control port connects', async () => {
            let isProperlyAuthenticated = false;
            const serverHash = '1A6C3485BD58CAF688C5AF98B878E713A6EF0EAC0240D7E3453341689BA7FC60';
            const serverNonce = '88601906AB5EB92B8CB86E012C0074855E23AA1C79F843BEA5FDE674936E9AB1';
            const cookieString = await getCookieString(authFilePath);
            const authenticationKey = 'Tor safe cookie authentication controller-to-server hash';

            let clientNonce = '';

            function torControlPortMock(sock: Socket) {
                sock.on('data', (data: string) => {
                    const message = data.toString();

                    const authchallengeRequest = message
                        .trim()
                        .match(/^AUTHCHALLENGE SAFECOOKIE ([a-fA-F0-9]+)$/m);
                    const authenticateRequest = message
                        .trim()
                        .match(/^AUTHENTICATE ([a-fA-F0-9]+)$/m);
                    const providedAuthSignature = authenticateRequest && authenticateRequest[1];

                    const authString = `${cookieString}${clientNonce}${serverNonce}`;
                    const authSignature = createHmacSignature(authString, authenticationKey);

                    switch (true) {
                        case !!authenticateRequest:
                            isProperlyAuthenticated = providedAuthSignature === authSignature;
                            sock.write('250 OK');
                            break;
                        case !!authchallengeRequest:
                            clientNonce = authchallengeRequest ? authchallengeRequest[1] : '';
                            sock.write(
                                `250 AUTHCHALLENGE SERVERHASH=${serverHash} SERVERNONCE=${serverNonce}`,
                            );
                            break;
                        default:
                    }
                });
            }

            const serverControlPort = net.createServer(torControlPortMock);
            const startListening = () =>
                new Promise(resolve => {
                    serverControlPort.listen(controlPort, host, () => {
                        resolve(1);
                    });
                });

            await startListening();

            const options: TorConnectionOptions = {
                host,
                port,
                controlPort,
                authFilePath,
            };
            const fakeListener = () => {};
            const torControlPort = new TorControlPort(options, fakeListener);
            await torControlPort.connect();
            const response = torControlPort.ping();
            expect(response).toEqual(true);
            const waitForProperAuth = () =>
                new Promise(resolve => {
                    const interval = setInterval(() => {
                        if (isProperlyAuthenticated) {
                            clearInterval(interval);
                            resolve(isProperlyAuthenticated);
                        }
                    }, 100);
                });
            expect(await waitForProperAuth()).toEqual(true);

            serverControlPort.close();
            torControlPort.socket.destroy();
        });
    });
});
