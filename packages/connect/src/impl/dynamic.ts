import { ERRORS } from '@trezor/connect-common/src/constants';
import { ConnectEmitter } from '@trezor/connect-common/src/types/emitter';
import { getSynchronize } from '@trezor/utils';

import { parseManifest, parseVersion } from '../data/connectSettings';
import type { CallMethodPayload } from '../events';
import { createErrorMessage } from '../events';
import type { ConnectFactoryDependencies } from '../factory';
import type { ConnectSettings } from '../types';
import type { UpdateConnectSettings } from '../types/api/updateConnectSettings';

export type ConnectImplSettings = {
    manifest: NonNullable<ConnectSettings['manifest']>;
    version: NonNullable<ConnectSettings['version']>;
    env?: ConnectSettings['env'];
    debug?: ConnectSettings['debug'];
};

type CoreMode = 'auto' | 'suite-desktop' | 'suite-web';

export type ConnectDynamicSettings = Partial<ConnectImplSettings> & {
    coreMode?: CoreMode;
};

type ImplType = 'core-in-suite-desktop' | 'core-in-suite-web';

export type ConnectImpl = Omit<
    ConnectFactoryDependencies<{}>,
    'init' | 'eventEmitter' | 'uiResponse' | 'updateConnectSettings'
> & {
    init: (params: ConnectImplSettings) => Promise<void>;
};

type TrezorConnectDynamicParams = {
    implementations: Record<ImplType, ConnectImpl>;
};

/**
 * Implementation of TrezorConnect that can dynamically switch between different implementations.
 *
 */
export class TrezorConnectDynamic implements ConnectFactoryDependencies<{}> {
    public readonly eventEmitter = new ConnectEmitter();

    private currentTarget: ImplType;
    private readonly implementations: Record<ImplType, ConnectImpl>;

    private coreMode?: CoreMode;
    private implSettings?: ConnectImplSettings;
    private callPending = 0;
    private beforeCallSynchronize = getSynchronize();

    public constructor({ implementations }: TrezorConnectDynamicParams) {
        this.implementations = implementations;
        this.currentTarget = 'core-in-suite-desktop';
    }

    public getTarget() {
        return this.implementations[this.currentTarget];
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

    public async init(settings: ConnectDynamicSettings) {
        this.coreMode = settings.coreMode;

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
        };

        this.currentTarget = this.getInitTarget();
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

    public updateConnectSettings(_params: UpdateConnectSettings) {
        return Promise.resolve(
            createErrorMessage(
                ERRORS.TypedError(
                    'Method_InvalidPackage',
                    'updateConnectSettings is not supported in this implementation',
                ),
            ),
        );
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
                if (await this.handleErrorFallback(response.error.code)) {
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

    public cancel(error?: string) {
        return this.getTarget().cancel(error);
    }

    public dispose() {
        this.eventEmitter.removeAllListeners();
        this.callPending = 0;

        return this.getTarget().dispose();
    }

    private getInitTarget() {
        const { coreMode } = this;

        if (coreMode === 'suite-desktop') {
            return 'core-in-suite-desktop';
        } else if (coreMode === 'suite-web') {
            return 'core-in-suite-web';
        } else {
            if (coreMode && coreMode !== 'auto') {
                console.warn(`Invalid coreMode: ${coreMode}`);
            }

            // TODO for webextension, default was previously core-in-suite-web
            return 'core-in-suite-desktop';
        }
    }

    private async handleBeforeCall() {
        const { coreMode } = this;

        // Always try if desktop is available again
        if (coreMode === 'suite-desktop' || coreMode === 'auto' || coreMode === undefined) {
            await this.switchTarget('core-in-suite-desktop');
        }
    }

    private async handleErrorFallback(errorCode: string) {
        // Handle desktop errors
        if (
            this.getTargetType() === 'core-in-suite-desktop' &&
            // TODO for webextension, Method_Unsupported wasn't here
            (errorCode === 'Desktop_ConnectionMissing' || errorCode === 'Method_Unsupported')
        ) {
            await this.switchTarget('core-in-suite-web');

            return true;
        }

        return false;
    }

    // this shouldn't be needed, ui response should be handled in suite
    public uiResponse() {
        throw ERRORS.TypedError('Method_InvalidPackage');
    }
}
