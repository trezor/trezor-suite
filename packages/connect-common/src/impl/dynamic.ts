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

type TrezorConnectDynamicParams = {
    handleBeforeInit?: () => void;
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
    private handleBeforeInit: TrezorConnectDynamicParams['handleBeforeInit'];

    public lastSettings?: InitFullSettings<SettingsType>;
    private callPending = 0;
    private beforeCallSynchronize = getSynchronize();

    public constructor({ handleBeforeInit }: TrezorConnectDynamicParams) {
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
        this.handleBeforeInit = handleBeforeInit;
        this.implementations.forEach(impl => {
            impl.impl.eventEmitter = this.eventEmitter;
        });
    }

    // TODO this was a bit different for web and webextension
    private getInitTarget({ coreMode }: InitFullSettings<SettingsType>) {
        if (coreMode === 'suite-desktop') {
            return 'core-in-suite-desktop';
        } else if (coreMode === 'suite-web') {
            return 'core-in-suite-web';
        } else {
            if (coreMode && coreMode !== 'auto') {
                console.warn(`Invalid coreMode: ${coreMode}`);
            }

            return 'core-in-suite-desktop';
        }
    }

    private async handleBeforeCall() {
        // Always try if desktop is available again
        const isCoreModeDesktop = this.lastSettings?.coreMode === 'suite-desktop';
        const isCoreModeAuto =
            this.lastSettings?.coreMode === 'auto' || this.lastSettings?.coreMode === undefined;
        if (isCoreModeDesktop || isCoreModeAuto) {
            await this.switchTarget('core-in-suite-desktop');
        }
    }

    private async handleErrorFallback(errorCode: string) {
        // Handle desktop errors
        if (
            this.getTargetType() === 'core-in-suite-desktop' &&
            // TODO Method_Unsupported was only in connect-web; not in connect-webextension
            (errorCode === 'Desktop_ConnectionMissing' || errorCode === 'Method_Unsupported')
        ) {
            await this.switchTarget('core-in-suite-web');

            return true;
        }

        return false;
    }

    private getTarget() {
        return this.implementations.find(impl => impl.type === this.currentTarget)!.impl;
    }

    private getTargetType() {
        return this.currentTarget;
    }

    private async switchTarget(target: ImplType) {
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
