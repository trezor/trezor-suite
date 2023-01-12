import { Transport } from './abstract';
import { UsbTransport } from './usb';
import { SessionsClient } from '../sessions/client';

// todo: discuss in review solutions how to go about loading workers
// 1. use inline worker loader like this.
// import BackgroundSharedWorker from 'worker-loader?worker=SharedWorker!../sessions/background-sharedworker';
// 2. use solution similar to workers in blockchain-link
// import BackgroundSharedWorker from '../sessions/background-sharedworker';
// const worker = new SharedWorker(BackgroundSharedWorker);
// connect-iframe/webpack/prod.webpack.config.ts
// connect/src/workers/workers-browser.ts
// General note:
// I don't like using one file both as a worker and module. Might be my personal preference
// but it feels cleaner to separate logic into one file and wrap it into a worker in another
// file (background-sharedworker)

// @ts-expect-error
import BackgroundSharedWorker from 'worker-loader?worker=SharedWorker!../sessions/background-sharedworker';
const worker = new BackgroundSharedWorker();

const registerCallbackOnDescriptorsChange = (onListenCallback: any) => {
    worker.port.addEventListener('message', (e: any) => {
        if (e.data.type === 'descriptors') {
            console.log('webusb: descriptors from outside', e.data.payload);
            onListenCallback(e.data.payload);
        }
    });
};

const requestFn = (params: any) =>
    new Promise(resolve => {
        try {
            const onmessage = (message: any) => {
                // todo: ids would be more bulletproof
                if (params.type === message.data.originalType) {
                    resolve(message.data);
                    worker.port.removeEventListener('message', onmessage);
                }
            };

            worker.port.addEventListener('message', onmessage);
            worker.port.onmessageerror = (message: any) => {
                console.error('worker.port.onmessageerror,', message);
                resolve(message);
            };
            console.log('=>>==postmessage', params);
            worker.port.postMessage(params);
        } catch (err) {
            console.error(err);
        }
    });

type UsbTransportConstructorParams = ConstructorParameters<typeof Transport>[0];

/**
 * Webusb transport
 * - chrome supported
 * - firefox not supported https://mozilla.github.io/standards-positions/#webusb
 */
export class WebUsbTransport extends UsbTransport {
    constructor({ messages }: UsbTransportConstructorParams = {}) {
        super({
            messages,
            // abstract interface facades with abort controllers. "zrus vsechno a pokracuj"
            // todo
            // @ts-expect-error. navigator.usb should have roughly the same interface like node usb lib
            usbInterface: navigator.usb,
            // sessions client with a request fn facilitating communication with a session backend (shared worker in case of webusb)
            sessionsClient: new SessionsClient({ requestFn, registerCallbackOnDescriptorsChange }),
        });
        this.name = 'WebUsbTransport';
    }
}
