import EventEmitter from 'events';

import { getSynchronize } from '@trezor/utils';

import { ERRORS } from '../constants';
import { CallMethodPayload, createErrorMessage } from '../events';
import { ConnectFactoryDependencies } from '../factory';
import { InitFullSettings } from '../types/api/init';
import type { SetTransports } from '../types/api/setTransports';
import type { Manifest } from '../types/settings';
import { ProxyEventEmitter } from '../utils/proxy-event-emitter';

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
    handleBeforeCall: () => Promise<void>;
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
    private handleBeforeCall: TrezorConnectDynamicParams<
        ImplType,
        SettingsType,
        ImplInterface
    >['handleBeforeCall'];
    private handleErrorFallback: TrezorConnectDynamicParams<
        ImplType,
        SettingsType,
        ImplInterface
    >['handleErrorFallback'];

    public lastSettings?: InitFullSettings<SettingsType>;
    private callPending = 0;
    private beforeCallSynchronize = getSynchronize();

    public constructor({
        implementations,
        getInitTarget,
        handleBeforeCall,
        handleErrorFallback,
    }: TrezorConnectDynamicParams<ImplType, SettingsType, ImplInterface>) {
        this.implementations = implementations;
        this.currentTarget = this.implementations[0].type;
        this.getInitTarget = getInitTarget;
        this.handleBeforeCall = handleBeforeCall;
        this.handleErrorFallback = handleErrorFallback;
        this.eventEmitter = new ProxyEventEmitter(
            this.implementations.map(impl => impl.impl.eventEmitter),
        );
    }

    public getTarget() {
        return this.implementations.find(impl => impl.type === this.currentTarget)!.impl;
    }

    public getTargetType() {
        return this.currentTarget;
    }

    public async switchTarget(target: ImplType) {
        if (this.currentTarget === target) {
            return;
        }

        if (!this.lastSettings) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }

        // Go back to the old target if the new target fails to initialize
        const oldTargetType = this.getTargetType();
        const oldTarget = this.getTarget();
        try {
            this.currentTarget = target;
            await this.getTarget().init(this.lastSettings);
            await oldTarget.dispose();
        } catch {
            this.currentTarget = oldTargetType;
        }
    }

    public manifest(manifest: Manifest) {
        this.lastSettings = { ...this.lastSettings, manifest } as typeof this.lastSettings;

        this.getTarget().manifest(manifest);
    }

    public async init(settings: InitFullSettings<SettingsType>) {
        if (!settings?.manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }
        // Save settings for later use
        this.lastSettings = settings;

        this.currentTarget = this.getInitTarget(settings);
        this.callPending = 0;

        // Initialize the target
        try {
            return await this.getTarget().init(this.lastSettings);
        } catch (error) {
            // Handle error by switching to other implementation if available as defined in `handleErrorFallback`.
            if (await this.handleErrorFallback(error.code)) {
                return;
            }

            throw error;
        }
    }

    public setTransports({ transports }: SetTransports) {
        this.lastSettings = { ...this.lastSettings, transports } as typeof this.lastSettings;
        this.getTarget().setTransports({ transports });
    }

    public async call(params: CallMethodPayload) {
        try {
            // Edge case - if there are simultaneous calls, we only want to call `handleBeforeCall` once
            if (this.callPending === 0) {
                await this.beforeCallSynchronize(async () => {
                    this.callPending++;
                    await this.handleBeforeCall();
                });
            }
            const response = await this.getTarget().call(params);
            if (!response.success) {
                if (await this.handleErrorFallback(response.payload.code)) {
                    return await this.getTarget().call(params);
                }
            }

            return response;
        } catch (error) {
            // Don't throw but return error payload
            return createErrorMessage(error);
        } finally {
            this.callPending--;
        }
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
        this.callPending = 0;

        return this.getTarget().dispose();
    }
}
