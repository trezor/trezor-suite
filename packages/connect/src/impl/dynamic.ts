import EventEmitter from 'events';

import { ConnectFactoryDependencies } from '@trezor/connect/src/factory';
import type { ConnectSettings, ConnectSettingsPublic, Manifest } from '@trezor/connect/src/types';
import { CallMethodPayload } from '@trezor/connect/src/events';

import { ProxyEventEmitter } from '../utils/proxy-event-emitter';

type TrezorConnectType = 'core-in-popup' | 'iframe';

const IFRAME_ERRORS = ['Init_IframeBlocked', 'Init_IframeTimeout', 'Transport_Missing'];

type TrezorConnectDynamicParams = {
    implementations: {
        type: TrezorConnectType;
        impl: ConnectFactoryDependencies;
    }[];
    getEnv: () => string;
};
/**
 * Implementation of TrezorConnect that can dynamically switch between iframe and core-in-popup implementations
 */
export class TrezorConnectDynamic implements ConnectFactoryDependencies {
    public eventEmitter: EventEmitter;

    private currentTarget: TrezorConnectType = 'iframe';
    private implementations: TrezorConnectDynamicParams['implementations'];
    private getEnv: TrezorConnectDynamicParams['getEnv'];

    private lastSettings?: Partial<ConnectSettings>;

    public constructor({ implementations, getEnv }: TrezorConnectDynamicParams) {
        this.implementations = implementations;
        this.getEnv = getEnv;
        this.eventEmitter = new ProxyEventEmitter(
            this.implementations.map(impl => impl.impl.eventEmitter),
        );
    }

    private getTarget() {
        return this.implementations.find(impl => impl.type === this.currentTarget)!.impl;
    }

    private async switchTarget(target: TrezorConnectType) {
        if (this.currentTarget === target) {
            return;
        }

        await this.getTarget().dispose();
        this.currentTarget = target;
        // @ts-ignore
        await this.getTarget().init(this.lastSettings);
    }

    public manifest(manifest: Manifest) {
        this.lastSettings = {
            ...this.lastSettings,
            manifest,
        };

        this.getTarget().manifest(manifest);
    }

    public async init(settings: Partial<ConnectSettingsPublic> = {}) {
        const env = this.getEnv();
        if (settings.coreMode === 'iframe' || settings.popup === false || env === 'webextension') {
            this.currentTarget = 'iframe';
        } else if (settings.coreMode === 'popup') {
            this.currentTarget = 'core-in-popup';
        } else {
            // Default to auto mode with iframe as the first choice
            settings.coreMode = 'auto';
            this.currentTarget = 'iframe';
        }

        // Save settings for later use
        this.lastSettings = settings;

        // Initialize the target
        try {
            // @ts-ignore
            return await this.getTarget().init(settings);
        } catch (error) {
            // Handle iframe errors by switching to core-in-popup
            // @ts-ignore
            if (await this.handleErrorFallback(error.code)) {
                // @ts-ignore
                return await this.getTarget().init(settings);
            }

            throw error;
        }
    }

    public async call(params: CallMethodPayload) {
        const response = await this.getTarget().call(params);
        if (!response.success) {
            if (await this.handleErrorFallback(response.payload.code)) {
                return await this.getTarget().call(params);
            }
        }

        return response;
    }

    private async handleErrorFallback(errorCode: string) {
        // Handle iframe errors by switching to core-in-popup
        if (this.lastSettings?.coreMode === 'auto' && IFRAME_ERRORS.includes(errorCode)) {
            // Check if WebUSB is available and enabled
            // @ts-ignore
            const webUsbUnavailableInBrowser = !navigator.usb;
            const webUsbDisabledInSettings =
                this.lastSettings.transports?.includes('WebUsbTransport') === false ||
                this.lastSettings.webusb === false;
            if (
                errorCode === 'Transport_Missing' &&
                (webUsbUnavailableInBrowser || webUsbDisabledInSettings)
            ) {
                // WebUSB not available, no benefit in switching to core-in-popup
                return false;
            }

            await this.switchTarget('core-in-popup');

            return true;
        }

        return false;
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
