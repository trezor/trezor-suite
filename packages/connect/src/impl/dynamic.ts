import EventEmitter from 'events';

import { ConnectFactoryDependencies } from '../factory';
import type { Manifest } from '../types/settings';
import { CallMethodPayload } from '../events';
import { ERRORS } from '../constants';

import { ProxyEventEmitter } from '../utils/proxy-event-emitter';
import { InitFullSettings } from '../types/api/init';

type TrezorConnectDynamicParams<
    ImplType,
    SettingsType extends Record<string, any>,
    ImplInterface extends ConnectFactoryDependencies<SettingsType>,
> = {
    implementations: {
        type: ImplType;
        impl: ImplInterface;
    }[];
    getInitTarget: (settings: InitFullSettings<SettingsType>) => ImplType;
    handleErrorFallback: (errorCode: string) => Promise<boolean>;
};

/**
 * Implementation of TrezorConnect that can dynamically switch between different implementations.
 *
 */
export class TrezorConnectDynamic<
    ImplType,
    SettingsType extends Record<string, any>,
    ImplInterface extends ConnectFactoryDependencies<SettingsType>,
> implements ConnectFactoryDependencies<SettingsType>
{
    public eventEmitter: EventEmitter;

    private currentTarget: ImplType;
    private implementations: TrezorConnectDynamicParams<
        ImplType,
        SettingsType,
        ImplInterface
    >['implementations'];
    private getInitTarget: TrezorConnectDynamicParams<
        ImplType,
        SettingsType,
        ImplInterface
    >['getInitTarget'];
    private handleErrorFallback: TrezorConnectDynamicParams<
        ImplType,
        SettingsType,
        ImplInterface
    >['handleErrorFallback'];

    public lastSettings?: InitFullSettings<SettingsType>;

    public constructor({
        implementations,
        getInitTarget,
        handleErrorFallback,
    }: TrezorConnectDynamicParams<ImplType, SettingsType, ImplInterface>) {
        this.implementations = implementations;
        this.currentTarget = this.implementations[0].type;
        this.getInitTarget = getInitTarget;
        this.handleErrorFallback = handleErrorFallback;
        this.eventEmitter = new ProxyEventEmitter(
            this.implementations.map(impl => impl.impl.eventEmitter),
        );
    }

    public getTarget() {
        return this.implementations.find(impl => impl.type === this.currentTarget)!.impl;
    }

    public async switchTarget(target: ImplType) {
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
        // @ts-expect-error hell knows why this is not working
        this.lastSettings = {
            ...this.lastSettings,
            manifest,
        };

        this.getTarget().manifest(manifest);
    }

    public async init(settings: InitFullSettings<SettingsType>) {
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

    public cancel(error?: string) {
        return this.getTarget().cancel(error);
    }

    public dispose() {
        this.eventEmitter.removeAllListeners();

        return this.getTarget().dispose();
    }
}
