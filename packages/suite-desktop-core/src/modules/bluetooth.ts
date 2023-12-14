/* eslint-disable no-underscore-dangle */
/* eslint-disable max-classes-per-file */

// eslint-disable-next-line import/no-extraneous-dependencies
import {
    Transport,
    AbstractApiTransport,
    SessionsBackground,
    SessionsClient,
} from '@trezor/transport';

import { app, ipcMain, StrictBrowserWindow } from '../typed-electron';

import type { Module } from './index';

const bluetoothFlag = true; // app.commandLine.hasSwitch('bluetooth');
if (bluetoothFlag) {
    let flag = 'enable-web-bluetooth';
    if (process.platform === 'linux') {
        flag = 'enable-experimental-web-platform-features';
        // app.commandLine.appendSwitch('enable-features', 'WebBluetoothConfirmPairingSupport');
    }
    app.commandLine.appendSwitch(flag);
}

export const SERVICE_NAME = 'bluetooth';

type Args = ConstructorParameters<typeof Transport>[0] & { mainWindow: any };

export class WebBluetoothTransport extends AbstractApiTransport {
    public name = 'WebBluetoothTransport' as const;
    mainWindow: StrictBrowserWindow;
    messageId = 0;

    constructor({ mainWindow, logger }: Args) {
        const sessionsBackground = new SessionsBackground();

        // in udp there is no synchronization yet. it depends where this transport runs (node or browser)
        const sessionsClient = new SessionsClient({
            requestFn: args => sessionsBackground.handleMessage(args),
            registerBackgroundCallbacks: () => {},
        });

        sessionsBackground.on('descriptors', descriptors => {
            sessionsClient.emit('descriptors', descriptors);
        });

        const api = new Proxy(
            {},
            {
                get: (proxyTarget: any, name) => {
                    if (proxyTarget[name]) {
                        return proxyTarget[name];
                    }
                    proxyTarget[name] = this.sendToIpc(name);
                    return proxyTarget[name];
                },
            },
        );

        super({
            api,
            logger,
            sessionsClient,
        });

        this.mainWindow = mainWindow;
        this.version = '0.0.1';
    }

    private async _listen(): Promise<void> {
        if (this.stopped) {
            return;
        }
        const listenTimestamp = new Date().getTime();

        const fn = this.sendToIpc('listen'); // should be listen?
        const response: any = await fn(
            {
                body: this.descriptors,
                signal: this.abortController.signal,
            },
            {},
        );

        if (!response.success) {
            const time = new Date().getTime() - listenTimestamp;
            if (time > 1100) {
                // await createTimeoutPromise(1000);
                return this._listen();
            }
            this.emit('transport-error', response.error);
            return;
        }

        this.handleDescriptorsChange(response.payload);

        setTimeout(() => this._listen(), 5000);
    }

    // listen() {
    //     if (this.listening) {
    //         return this.error({ error: 'already listening' });
    //     }

    //     this.listening = true;
    //     console.warn('Listen electron BluetoothTransport');

    //     // ipcMain.on('bluetooth/transport-update', (_, devices) => {
    //     //     // 2. we signal this to sessions background
    //     //     this.handleDescriptorsChange(devices);
    //     // });

    //     this._listen();
    //     return this.success(undefined);
    // }

    private addInternalListener(eventName: any, listener: any) {
        // @ts-expect-error any
        ipcMain.on(eventName, (_, response) => {
            listener(response);
        });

        if (eventName === 'transport-interface-change') {
            this._listen();
            // this.mainWindow.webContents.send('bluetooth/bluetooth/pairing-start');
        }
        return Promise.resolve();
    }

    private sendToIpc(method: any): (...args: any[]) => Promise<any> {
        if (method === 'on') {
            return this.addInternalListener.bind(this);
        }

        return (...args: any[]): Promise<any> => {
            console.warn('Proxy sendToIpc', method, args);
            this.messageId++;

            this.mainWindow.webContents.send('bluetooth/api-request', {
                messageId: this.messageId,
                method,
                args,
            });

            return new Promise(resolve => {
                // @ts-expect-error any
                ipcMain.once(`bluetooth/api-response/${this.messageId}`, (_, response) => {
                    console.warn('BT api response event', response);
                    resolve(this.success(response.payload));
                });
            });
        };
    }

    // Override call/send encoding options, use chunkSize = 244, same as @trezor/transport/webbluetooth.browser

    private setEncodeSize(protocol?: { encode: (...args: any[]) => any }) {
        if (!protocol) return;
        return {
            ...protocol,
            encode: (...[data, options]: Parameters<typeof protocol.encode>) =>
                protocol.encode(data, { ...options, chunkSize: 244 }),
        } as typeof protocol;
    }

    public call({ protocol, ...params }: any) {
        return super.call({
            ...params,
            protocol: this.setEncodeSize(protocol),
        });
    }

    public send({ protocol, ...params }: any) {
        return super.send({
            ...params,
            protocol: this.setEncodeSize(protocol),
        });
    }

    // init() {
    //     return this.sendToIpc('init')().finally(() => super.init());
    // }
}

export const init: Module = ({ mainWindow }) => {
    if (bluetoothFlag) {
        // Possible windows issue https://github.com/electron/electron/issues/33111

        let pairDeviceCallback: (deviceId: any) => void | undefined;
        // ipcMain.on(`bluetooth/pair-device-result`, (_, response) => {
        //     console.warn('bluetooth/pair-device-result', response);
        //     if (pairDeviceCallback) {
        //         pairDeviceCallback(response);
        //     }
        // });
        mainWindow.webContents.session.setBluetoothPairingHandler((_details, callback) => {
            console.warn('=====>setBluetoothPairingHandler', pairDeviceCallback);

            pairDeviceCallback = callback;
            // Send a message to the renderer to prompt the user to confirm the pairing.
            // mainWindow.webContents.send('bluetooth-pairing-request', details);
            // mainWindow.webContents.send('bluetooth/pair-device-request', details);
        });

        let selectDeviceCallback: (deviceId: string) => void | undefined;
        ipcMain.on('bluetooth/select-device-result', (_, response) => {
            console.warn('bluetooth/select-device-result', response);
            if (selectDeviceCallback) {
                selectDeviceCallback(response);
            }
        });

        mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
            event.preventDefault();
            console.warn('select-bluetooth-device', deviceList.length);
            mainWindow.webContents.send('bluetooth/select-device-request', deviceList);

            selectDeviceCallback = callback;
            // const result = deviceList.find(device => device.deviceName === 'Trezor');
            // if (result) {
            //     callback(result.deviceId);
            // } else {
            //     // callback('');
            // }
            // selectBluetoothCallback = callback;
            // const result = deviceList.find(device => device.deviceName === 'Trezor');
            // if (result) {
            //     callback(result.deviceId);
            // } else {
            //     // The device wasn't found so we need to either wait longer (eg until the
            //     // device is turned on) or until the user cancels the request
            // }
        });

        // return () => ({
        //     init: () => {},
        //     dispose: () => {},
        //     on: () => {},
        //     off: () => {},
        //     openDevice: () => {},
        //     closeDevice: () => {},
        //     read: () => {},
        //     write: () => {},
        // });
    }
};
