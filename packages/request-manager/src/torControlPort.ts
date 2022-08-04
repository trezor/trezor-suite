import net, { Socket } from 'net';
import fs from 'fs';
import crypto from 'crypto';
import util from 'util';
import path from 'path';
import { TorConnectionOptions } from './types';

const readFile = util.promisify(fs.readFile);
const randomBytes = util.promisify(crypto.randomBytes);

export const getCookieString = async (authFilePath: string) => {
    const controlAuthCookiePath = path.join(authFilePath, 'control_auth_cookie');
    return (await readFile(controlAuthCookiePath)).toString('hex');
};

export const createHmacSignature = (authString: string, key: string) => {
    const bufferToSign = Buffer.from(authString, 'hex');
    return crypto.createHmac('sha256', key).update(bufferToSign).digest('hex').toUpperCase();
};

const getClientNonce = async () => (await randomBytes(32)).toString('hex');

export class TorControlPort {
    options: TorConnectionOptions;
    socket: Socket;
    isSocketConnected = false;
    isCircuitDone = false;
    clientNonce = '';

    onMessageReceived: (message: string) => void;

    constructor(options: TorConnectionOptions, onMessageReceived: (message: string) => void) {
        this.options = options;
        this.socket = new net.Socket();
        this.onMessageReceived = onMessageReceived;
    }

    connect() {
        return new Promise((resolve, reject) => {
            if (this.isSocketConnected) {
                return resolve(true);
            }

            this.socket.connect(this.options.controlPort, this.options.host);

            this.socket.on('connect', async () => {
                await (async () => {
                    this.clientNonce = await getClientNonce();
                    this.write(`AUTHCHALLENGE SAFECOOKIE ${this.clientNonce}`);
                })();
            });

            this.socket.on('data', async data => {
                const message = data.toString();
                this.onMessageReceived(message);
                // Section 3.24. AUTHCHALLENGE in https://gitweb.torproject.org/torspec.git/tree/control-spec.txt
                // https://stem.torproject.org/faq.html#i-m-using-safe-cookie-authentication
                const authchallengeResponse = message
                    .trim()
                    .match(
                        /^250 AUTHCHALLENGE SERVERHASH=([a-fA-F0-9]+) SERVERNONCE=([a-fA-F0-9]+)$/,
                    );
                if (authchallengeResponse) {
                    let cookieString;
                    try {
                        cookieString = await getCookieString(this.options.authFilePath);
                    } catch (error) {
                        reject(new Error('TOR control port control_auth_cookie cannot be read'));
                    }
                    const serverNonce = authchallengeResponse[2];
                    const authString = `${cookieString}${this.clientNonce}${serverNonce}`;

                    // key is a hardcoded string provided by the TOR control-spec
                    const key = 'Tor safe cookie authentication controller-to-server hash';
                    const authSignature = createHmacSignature(authString, key);
                    this.write(`AUTHENTICATE ${authSignature}`);
                    this.write('GETINFO circuit-status');
                    this.isSocketConnected = true;
                    this.subscribeEvents();
                    resolve(true);
                }
            });

            this.socket.on('close', () => {
                this.close();
                reject();
            });

            this.socket.on('timeout', () => {
                this.close();
                reject();
            });

            this.socket.on('end', () => {
                this.close();
                reject();
            });

            this.socket.on('error', error => {
                this.close();
                reject(error);
            });
        });
    }

    close() {
        this.isSocketConnected = false;
        this.socket.removeAllListeners();
    }

    ping() {
        if (!this.isSocketConnected) {
            return false;
        }
        try {
            return !!this.write('GETINFO');
        } catch (error) {
            return false;
        }
    }

    write(command: string): boolean {
        return this.socket.write(`${command}\r\n`);
    }

    subscribeEvents() {
        const events = ['STATUS_CLIENT'];
        this.write(`SETEVENTS ${events.join(' ')}`);
    }
}
