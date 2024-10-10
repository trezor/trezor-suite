import EventEmitter from 'events';

import { ConnectFactoryDependencies } from '../factory';
import type { ConnectSettingsPublic, Manifest } from '../types';
import { CallMethodPayload } from '../events';
import { ERRORS } from '../constants';

import { ProxyEventEmitter } from '../utils/proxy-event-emitter';

type TrezorConnectDynamicParams<TrezorConnectImplType> = {
    implementations: {
        type: TrezorConnectImplType;
        impl: ConnectFactoryDependencies;
    }[];
    getInitTarget: (settings: Partial<ConnectSettingsPublic>) => TrezorConnectImplType;
    handleErrorFallback: (errorCode: string) => Promise<boolean>;
};

/**
 * Implementation of TrezorConnect that can dynamically switch between different implementations.
 *
 */
export class TrezorConnectDynamic<TrezorConnectImplType> implements ConnectFactoryDependencies {
    public eventEmitter: EventEmitter;

    private currentTarget: TrezorConnectImplType;
    private implementations: TrezorConnectDynamicParams<TrezorConnectImplType>['implementations'];
    private getInitTarget: TrezorConnectDynamicParams<TrezorConnectImplType>['getInitTarget'];
    private handleErrorFallback: TrezorConnectDynamicParams<TrezorConnectImplType>['handleErrorFallback'];

    public lastSettings?: { manifest: Manifest } & Partial<ConnectSettingsPublic>;

    public constructor({
        implementations,
        getInitTarget,
        handleErrorFallback,
    }: TrezorConnectDynamicParams<TrezorConnectImplType>) {
        this.implementations = implementations;
        this.currentTarget = this.implementations[0].type;
        this.getInitTarget = getInitTarget;
        this.handleErrorFallback = handleErrorFallback;
        this.eventEmitter = new ProxyEventEmitter(
            this.implementations.map(impl => impl.impl.eventEmitter),
        );
    }

    private getTarget() {
        return this.implementations.find(impl => impl.type === this.currentTarget)!.impl;
    }

    public async switchTarget(target: TrezorConnectImplType) {
        if (this.currentTarget === target) {
            return;
        }

        if (!this.lastSettings) {
            throw ERRORS.TypedError('Init_NotInitialized');
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

    public async init(settings: { manifest: Manifest } & Partial<ConnectSettingsPublic>) {
        if (!settings?.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }
        // Save settings for later use
        this.lastSettings = settings;

        this.currentTarget = this.getInitTarget(settings);

        // Initialize the target
        try {
            return await this.getTarget().init(this.lastSettings);
        } catch (error) {
            // Handle error by switching to other implementation if available as defined in `handleErrorFallback`.
            if (await this.handleErrorFallback(error.code)) {
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
