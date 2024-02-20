import net, { Socket } from 'net';
import fs from 'fs';
import crypto from 'crypto';
import util from 'util';
import path from 'path';
import { promiseAllSequence } from '@trezor/utils';
import { TorConnectionOptions, TorCommandResponse } from './types';

const readFile = util.promisify(fs.readFile);
const randomBytes = util.promisify(crypto.randomBytes);

export const getCookieString = async (torDataDir: string) => {
    const controlAuthCookiePath = path.join(torDataDir, 'control_auth_cookie');

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
                        cookieString = await getCookieString(this.options.torDataDir);
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

    // https://gitweb.torproject.org/torspec.git/tree/control-spec.txt
    sendCommand(command: string) {
        return new Promise<TorCommandResponse>(resolve => {
            this.socket.once('data', data => {
                const payload = data.toString();
                if (/250 OK\r?\n/.test(payload)) {
                    resolve({ success: true, payload });
                } else {
                    resolve({ success: false, payload });
                }
            });

            try {
                this.write(command);
            } catch (error) {
                return { success: false, payload: error };
            }
        });
    }

    getInfo(command: string) {
        return this.sendCommand(`GETINFO ${command}`);
    }

    /* Tor circuit-status response format
     * - ${id:number} BUILT ${path: string[]} BUILD_FLAGS=${flags: string[]} PURPOSE={flag: string} TIME_CREATED=${utc_timestamp: string}\r\n
     * - ${id:number} EXTENDED BUILD_FLAGS=${flags: string[]} PURPOSE={flag: string} TIME_CREATED=${utc_timestamp: string} SOCKS_USERNAME=${user: string} SOCKS_PASSWORD=${user: string}\r\n
     *
     * Clients SHOULD NOT depend on the order of keyword=value arguments (...)
     * Read more: https://github.com/torproject/torspec/blob/8961bb4d83fccb2b987f9899ca83aa430f84ab0c/control-spec.txt#L2252
     */
    async getCircuits() {
        const status = await this.getInfo('circuit-status');
        if (status.success) {
            // helper fn to read values
            const getValue = (key: string, values: string[], quoted = false) => {
                const value = values.find(v => v.startsWith(key));
                if (!value) return;
                const resp = quoted ? value.match(/"(.*?)"/) : value.split('=');

                return resp ? resp[1] : undefined;
            };

            return status.payload
                .split('\r\n')
                .filter(line =>
                    /^[0-9]+ (LAUNCHED|BUILT|GUARD_WAIT|EXTENDED|FAILED|CLOSED)/.test(line),
                )
                .map(line => {
                    const [id, status, ...values] = line.split(' ');

                    return {
                        id,
                        status,
                        // not used for now, left as example:
                        // buildFlags: getValue('BUILD_FLAGS', values),
                        // purpose: getValue('PURPOSE', values),
                        // time: getValue('TIME_CREATED', values),
                        username: getValue('SOCKS_USERNAME', values, true),
                        password: getValue('SOCKS_PASSWORD', values, true),
                    };
                });
        }

        return [];
    }

    async closeActiveCircuits() {
        const circuits = await this.getCircuits();

        return promiseAllSequence(
            circuits.map(circuit => () => this.sendCommand(`closecircuit ${circuit.id}`)),
        );
    }

    async closeCircuit(identity?: string) {
        const circuits = await this.getCircuits();
        const circuitsToClose = identity
            ? circuits.filter(circuit => circuit.username === identity)
            : circuits.filter(circuit => !circuit.username || circuit.username === 'Default');

        return promiseAllSequence(
            circuitsToClose.map(circuit => () => this.sendCommand(`closecircuit ${circuit.id}`)),
        );
    }

    subscribeEvents() {
        const events = ['STATUS_CLIENT'];
        this.write(`SETEVENTS ${events.join(' ')}`);
    }
}
