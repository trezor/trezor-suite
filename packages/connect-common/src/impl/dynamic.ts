import EventEmitter from 'events';

import { CallMethodPayload, createErrorMessage } from '@trezor/connect/src/events';
import { ConnectFactoryDependencies } from '@trezor/connect/src/factory';
import { InitFullSettings } from '@trezor/connect/src/types/api/init';
import type { SetTransports } from '@trezor/connect/src/types/api/setTransports';
import type { Manifest } from '@trezor/connect/src/types/settings';
import { getSynchronize } from '@trezor/utils';

import { ERRORS } from '../constants';
import { CoreInSuiteDesktop } from './core-in-suite-desktop';
import { CoreInSuiteWeb } from './core-in-suite-web';

type ImplType = 'core-in-suite-desktop' | 'core-in-suite-web';

type TrezorConnectDynamicParams<SettingsType extends Record<string, any>> = {
    getInitTarget: (settings: InitFullSettings<SettingsType>) => ImplType;
    handleBeforeInit?: () => void;
    handleBeforeCall: () => Promise<void>;
    handleErrorFallback: (errorCode: string) => Promise<boolean>;
};

/**
 * Implementation of TrezorConnect that can dynamically switch between different implementations.
 *
 */
export class TrezorConnectDynamic<
    SettingsType extends Record<string, any>,
> implements ConnectFactoryDependencies<SettingsType> {
    public eventEmitter = new EventEmitter();

    private currentTarget: ImplType;
    private implementations: { type: ImplType; impl: ConnectFactoryDependencies<SettingsType> }[];
    private getInitTarget: TrezorConnectDynamicParams<SettingsType>['getInitTarget'];
    private handleBeforeInit: TrezorConnectDynamicParams<SettingsType>['handleBeforeInit'];
    private handleBeforeCall: TrezorConnectDynamicParams<SettingsType>['handleBeforeCall'];
    private handleErrorFallback: TrezorConnectDynamicParams<SettingsType>['handleErrorFallback'];

    public lastSettings?: InitFullSettings<SettingsType>;
    private callPending = 0;
    private beforeCallSynchronize = getSynchronize();

    public constructor({
        getInitTarget,
        handleBeforeInit,
        handleBeforeCall,
        handleErrorFallback,
    }: TrezorConnectDynamicParams<SettingsType>) {
        this.implementations = [
            {
                type: 'core-in-suite-desktop',
                impl: new CoreInSuiteDesktop(),
            },
            {
                type: 'core-in-suite-web',
                impl: new CoreInSuiteWeb(),
            },
        ];
        this.currentTarget = this.implementations[0].type;
        this.getInitTarget = getInitTarget;
        this.handleBeforeInit = handleBeforeInit;
        this.handleBeforeCall = handleBeforeCall;
        this.handleErrorFallback = handleErrorFallback;
        this.implementations.forEach(impl => {
            impl.impl.eventEmitter = this.eventEmitter;
        });
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
            this.handleBeforeInit?.();
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
            this.handleBeforeInit?.();

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
