import EventEmitter from 'events';

import { ERRORS } from '@trezor/connect-common/src/constants';
import { getSynchronize } from '@trezor/utils';

import { parseConnectSrc, parseManifest, parseVersion } from '../data/connectSettings';
import { CallMethodPayload, createErrorMessage } from '../events';
import { ConnectFactoryDependencies } from '../factory';
import { ConnectSettings, ConnectSettingsWeb } from '../types';
import type { SetTransports } from '../types/api/setTransports';

export type ConnectImplSettings = {
    manifest: NonNullable<ConnectSettings['manifest']>;
    version: NonNullable<ConnectSettings['version']>;
    env?: ConnectSettings['env'];
    debug?: ConnectSettings['debug'];
    connectSrc?: ConnectSettings['connectSrc'];
};

export type ConnectDynamicSettings = Partial<ConnectImplSettings>;

export type ConnectImpl = Omit<ConnectFactoryDependencies<ConnectSettingsWeb>, 'init'> & {
    init: (params: ConnectImplSettings) => Promise<void>;
};

type TrezorConnectDynamicParams<ImplType, ExtraSettings extends Record<string, any>> = {
    implementations: {
        type: ImplType;
        impl: ConnectImpl;
    }[];
    getInitTarget: (settings: ExtraSettings) => ImplType;
    handleBeforeCall: (settings?: ExtraSettings) => Promise<void>;
    handleErrorFallback: (errorCode: string) => Promise<boolean>;
};

/**
 * Implementation of TrezorConnect that can dynamically switch between different implementations.
 *
 */
export class TrezorConnectDynamic<
    ImplType,
    ExtraSettings extends Record<string, any>,
> implements ConnectFactoryDependencies<ExtraSettings> {
    public eventEmitter = new EventEmitter();

    private currentTarget: ImplType;
    private implementations: TrezorConnectDynamicParams<ImplType, ExtraSettings>['implementations'];
    private getInitTarget: TrezorConnectDynamicParams<ImplType, ExtraSettings>['getInitTarget'];
    private handleBeforeCall: TrezorConnectDynamicParams<
        ImplType,
        ExtraSettings
    >['handleBeforeCall'];
    private handleErrorFallback: TrezorConnectDynamicParams<
        ImplType,
        ExtraSettings
    >['handleErrorFallback'];

    private lastSettings?: ExtraSettings;
    private implSettings?: ConnectImplSettings;
    private callPending = 0;
    private beforeCallSynchronize = getSynchronize();

    public constructor({
        implementations,
        getInitTarget,
        handleBeforeCall,
        handleErrorFallback,
    }: TrezorConnectDynamicParams<ImplType, ExtraSettings>) {
        this.implementations = implementations;
        this.currentTarget = this.implementations[0].type;
        this.getInitTarget = getInitTarget;
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

        if (!this.implSettings) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }

        // Go back to the old target if the new target fails to initialize
        const oldTargetType = this.getTargetType();
        const oldTarget = this.getTarget();
        try {
            this.currentTarget = target;
            await this.getTarget().init(this.implSettings);
            await oldTarget.dispose();
        } catch {
            this.currentTarget = oldTargetType;
        }
    }

    public async init(settings: ConnectDynamicSettings & ExtraSettings) {
        this.lastSettings = settings;

        const manifest = parseManifest(settings.manifest);

        if (!manifest) {
            throw ERRORS.TypedError('Init_ManifestMissing');
        }

        // Save settings for later use
        this.implSettings = {
            manifest,
            env: settings.env,
            debug: settings.debug,
            version: parseVersion(settings.version),
            connectSrc: parseConnectSrc(settings.connectSrc),
        };

        this.currentTarget = this.getInitTarget(settings);
        this.callPending = 0;

        // Initialize the target
        try {
            return await this.getTarget().init(this.implSettings);
        } catch (error) {
            // Handle error by switching to other implementation if available as defined in `handleErrorFallback`.
            if (await this.handleErrorFallback(error.code)) {
                return;
            }

            throw error;
        }
    }

    public setTransports({ transports }: SetTransports) {
        this.getTarget().setTransports({ transports });
    }

    public async call(params: CallMethodPayload) {
        try {
            // Edge case - if there are simultaneous calls, we only want to call `handleBeforeCall` once
            if (this.callPending === 0) {
                await this.beforeCallSynchronize(async () => {
                    this.callPending++;
                    await this.handleBeforeCall(this.lastSettings);
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
