import { ConnectFactoryDependencies, factory } from '@trezor/connect/src/factory';
import { CoreInIframe } from './impl/core-in-iframe';
import { CoreInPopup } from './impl/core-in-popup';
import ProxyEventEmitter from './utils/proxy-event-emitter';
import type { ConnectSettings, Manifest } from '@trezor/connect/src/types';
import EventEmitter from 'events';
import { CallMethodPayload } from '@trezor/connect/src/events';

type TrezorConnectType = 'core-in-popup' | 'iframe';

const IFRAME_ERRORS = ['Init_IframeBlocked', 'Init_IframeTimeout', 'Transport_Missing'];

/**
 * Implementation of TrezorConnect that can dynamically switch between iframe and core-in-popup implementations
 */
export class TrezorConnectDynamicImpl implements ConnectFactoryDependencies {
    public eventEmitter: EventEmitter;

    private currentTarget: TrezorConnectType = 'iframe';
    private coreInIframeImpl: CoreInIframe;
    private coreInPopupImpl: CoreInPopup;

    private lastSettings?: Partial<ConnectSettings>;

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

    private async switchTarget(target: TrezorConnectType) {
        if (this.currentTarget === target) {
            return;
        }

        await this.getTarget().dispose();
        this.currentTarget = target;
        await this.getTarget().init(this.lastSettings);
    }

    public manifest(manifest: Manifest) {
        this.lastSettings = {
            ...this.lastSettings,
            manifest,
        };

        this.getTarget().manifest(manifest);
    }

    public async init(settings: Partial<ConnectSettings> = {}) {
        if (settings.useCoreInPopup || settings.coreMode === 'popup') {
            this.currentTarget = 'core-in-popup';
        } else {
            this.currentTarget = 'iframe';
        }

        // Save settings for later use
        this.lastSettings = settings;

        // Initialize the target
        try {
            return await this.getTarget().init(settings);
        } catch (error) {
            // Handle iframe errors by switching to core-in-popup
            if (settings.coreMode === 'auto' && IFRAME_ERRORS.includes(error.code)) {
                await this.switchTarget('core-in-popup');

                return await this.getTarget().init(settings);
            }

            throw error;
        }
    }

    public async call(params: CallMethodPayload) {
        const response = await this.getTarget().call(params);
        if (!response.success) {
            // Handle iframe errors by switching to core-in-popup
            if (
                this.lastSettings?.coreMode === 'auto' &&
                IFRAME_ERRORS.includes(response.payload.code)
            ) {
                await this.switchTarget('core-in-popup');

                return await this.getTarget().call(params);
            }
        }

        return response;
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

const impl = new TrezorConnectDynamicImpl();

const TrezorConnect = factory({
    eventEmitter: impl.eventEmitter,
    init: impl.init.bind(impl),
    call: impl.call.bind(impl),
    manifest: impl.manifest.bind(impl),
    requestLogin: impl.requestLogin.bind(impl),
    uiResponse: impl.uiResponse.bind(impl),
    renderWebUSBButton: impl.renderWebUSBButton.bind(impl),
    disableWebUSB: impl.disableWebUSB.bind(impl),
    requestWebUSBDevice: impl.requestWebUSBDevice.bind(impl),
    cancel: impl.cancel.bind(impl),
    dispose: impl.dispose.bind(impl),
});

export default TrezorConnect;
export * from '@trezor/connect/src/exports';
