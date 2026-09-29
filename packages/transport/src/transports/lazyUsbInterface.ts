import type { UsbInterfaceApi } from '@trezor/transport-common';

type UsbConnectionListener = UsbInterfaceApi['onconnect'];

/**
 * UsbInterfaceApi facade over a WebUSB instance that is created on first use.
 *
 * NodeUsbTransport loads the native usb addon through a dynamic import(): unlike a bare require()
 * (undefined in this package's published ESM output) or createRequire(import.meta.url) (a syntax
 * error in every CommonJS transform of these sources - babel-jest, Playwright, tsx), import() is
 * valid everywhere. Being asynchronous, the load has to happen behind the first getDevices() /
 * listener registration instead of in the transport constructor. Deferring it also means a broken
 * or missing addon surfaces as a failed enumerate rather than as a throw at construction.
 */
export class LazyUsbInterface implements UsbInterfaceApi {
    private instance?: Promise<UsbInterfaceApi>;
    private listeners: { onconnect: UsbConnectionListener; ondisconnect: UsbConnectionListener } = {
        onconnect: null,
        ondisconnect: null,
    };

    constructor(private readonly load: () => Promise<UsbInterfaceApi>) {}

    private getInstance() {
        if (!this.instance) {
            this.instance = this.load().then(
                instance => {
                    instance.onconnect = this.listeners.onconnect;
                    instance.ondisconnect = this.listeners.ondisconnect;

                    return instance;
                },
                error => {
                    // do not pin a failed load: the next call gets a fresh attempt
                    this.instance = undefined;
                    throw error;
                },
            );
        }

        return this.instance;
    }

    getDevices() {
        return this.getInstance().then(instance => instance.getDevices());
    }

    // Registering a listener starts the load so hotplug events are not missed when listen()
    // precedes the first enumerate. Clearing one (dispose) must not load an addon that was never
    // used; the load-time hand-over above covers the never-loaded case.
    private setListener(name: 'onconnect' | 'ondisconnect', listener: UsbConnectionListener) {
        this.listeners[name] = listener;
        if (listener || this.instance) {
            this.getInstance()
                .then(instance => {
                    instance[name] = listener;
                })
                .catch(() => {});
        }
    }

    get onconnect() {
        return this.listeners.onconnect;
    }

    set onconnect(listener: UsbConnectionListener) {
        this.setListener('onconnect', listener);
    }

    get ondisconnect() {
        return this.listeners.ondisconnect;
    }

    set ondisconnect(listener: UsbConnectionListener) {
        this.setListener('ondisconnect', listener);
    }
}
