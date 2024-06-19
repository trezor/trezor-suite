import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import { CoreInIframe } from './impl/core-in-iframe';
import { CoreInPopup } from './impl/core-in-popup';
import type { ConnectSettings, Manifest } from '@trezor/connect/src/types';
import EventEmitter from 'events';
import { CallMethodPayload } from '@trezor/connect';

type TrezorConnectType = 'core-in-popup' | 'iframe';

class ProxyEventEmitter implements EventEmitter {
    private eventEmitters: EventEmitter[];

    constructor(eventEmitters: EventEmitter[]) {
        this.eventEmitters = eventEmitters;
    }

    emit(eventName: string | symbol, ...args: any[]): boolean {
        this.eventEmitters.forEach(emitter => emitter.emit(eventName, ...args));

        return true;
    }

    on(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.on(eventName, listener));

        return this;
    }

    off(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.off(eventName, listener));

        return this;
    }

    once(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.once(eventName, listener));

        return this;
    }

    addListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.addListener(eventName, listener));

        return this;
    }

    prependListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.prependListener(eventName, listener));

        return this;
    }

    prependOnceListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.prependOnceListener(eventName, listener));

        return this;
    }

    removeAllListeners(event?: string | symbol | undefined): this {
        this.eventEmitters.forEach(emitter => emitter.removeAllListeners(event));

        return this;
    }

    removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.removeListener(eventName, listener));

        return this;
    }

    setMaxListeners(n: number): this {
        this.eventEmitters.forEach(emitter => emitter.setMaxListeners(n));

        return this;
    }

    eventNames(): (string | symbol)[] {
        return this.eventEmitters[0].eventNames();
    }

    getMaxListeners(): number {
        return this.eventEmitters[0].getMaxListeners();
    }

    listenerCount(eventName: string | symbol, listener?: FunctionConstructor | undefined) {
        return this.eventEmitters[0].listenerCount(eventName, listener);
    }

    rawListeners(eventName: string | symbol) {
        return this.eventEmitters[0].rawListeners(eventName);
    }

    listeners(eventName: string | symbol) {
        return this.eventEmitters[0].listeners(eventName);
    }
}

/**
 * Implementation of TrezorConnect that can dynamically switch between iframe and core-in-popup implementations
 */
export class TrezorConnectDynamicImpl implements ConnectFactoryDependencies {
    public eventEmitter: EventEmitter;

    private currentTarget: TrezorConnectType = 'iframe';
    private coreInIframeImpl: CoreInIframe;
    private coreInPopupImpl: CoreInPopup;

    public constructor() {
        this.coreInIframeImpl = new CoreInIframe();
        this.coreInPopupImpl = new CoreInPopup();
        this.eventEmitter = new ProxyEventEmitter([
            this.coreInIframeImpl.eventEmitter,
            this.coreInPopupImpl.eventEmitter,
        ]);
    }

    private getTarget() {
        return this.currentTarget === 'iframe' ? this.coreInIframeImpl : this.coreInPopupImpl;
    }

    public manifest(data: Manifest) {
        this.getTarget().manifest(data);
    }

    public init(settings: Partial<ConnectSettings> = {}) {
        if (settings.useCoreInPopup) {
            this.currentTarget = 'core-in-popup';
        } else {
            this.currentTarget = 'iframe';
        }

        return this.getTarget().init(settings);
    }

    public call(params: CallMethodPayload) {
        return this.getTarget().call(params);
    }

    public requestLogin(params: any) {
        return this.getTarget().requestLogin(params);
    }

    public uiResponse(params: any) {
        return this.getTarget().uiResponse(params);
    }

    public renderWebUSBButton() {
        return this.getTarget().renderWebUSBButton();
    }

    public disableWebUSB() {
        return this.getTarget().disableWebUSB();
    }

    public requestWebUSBDevice() {
        return this.getTarget().requestWebUSBDevice();
    }

    public cancel(error?: string) {
        return this.getTarget().cancel(error);
    }

    public dispose() {
        this.eventEmitter.removeAllListeners();

        return this.getTarget().dispose();
    }
}

const methods = new TrezorConnectDynamicImpl();

const TrezorConnect = factory({
    eventEmitter: methods.eventEmitter,
    init: methods.init.bind(methods),
    call: methods.call.bind(methods),
    manifest: methods.manifest.bind(methods),
    requestLogin: methods.requestLogin.bind(methods),
    uiResponse: methods.uiResponse.bind(methods),
    renderWebUSBButton: methods.renderWebUSBButton.bind(methods),
    disableWebUSB: methods.disableWebUSB.bind(methods),
    requestWebUSBDevice: methods.requestWebUSBDevice.bind(methods),
    cancel: methods.cancel.bind(methods),
    dispose: methods.dispose.bind(methods),
});

export default TrezorConnect;
export * from '@trezor/connect/src/exports';
