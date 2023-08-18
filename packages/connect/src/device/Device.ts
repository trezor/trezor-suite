// original file https://github.com/trezor/connect/blob/develop/src/js/device/Device.js

import { TypedEmitter } from '@trezor/utils/lib/typedEventEmitter';
import { DeviceCommands } from './DeviceCommands';
import { PROTO, ERRORS, NETWORK } from '../constants';
import { DEVICE, DeviceButtonRequestPayload, UI } from '../events';
import { getAllNetworks } from '../data/coinInfo';
import { getFirmwareStatus, getRelease } from '../data/firmwareInfo';
import {
    parseCapabilities,
    getUnavailableCapabilities,
    parseRevision,
    ensureInternalModelFeature,
} from '../utils/deviceFeaturesUtils';
import { versionCompare } from '../utils/versionUtils';
import { create as createDeferred, Deferred } from '../utils/deferred';
import { initLog } from '../utils/debug';
import type { Transport, Descriptor } from '@trezor/transport';
import {
    Device as DeviceTyped,
    DeviceFirmwareStatus,
    DeviceStatus,
    Features,
    ReleaseInfo,
    UnavailableCapabilities,
    FirmwareType,
} from '../types';

// custom log
const _log = initLog('Device');

export type RunOptions = {
    // skipFinalReload - normally, after action, features are reloaded again
    //                   because some actions modify the features
    //                   but sometimes, you don't need that and can skip that
    skipFinalReload?: boolean;
    // waiting - if waiting and someone else holds the session, it waits until it's free
    //          and if it fails on acquire (because of more tabs acquiring simultaneously),
    //          it tries repeatedly
    waiting?: boolean;
    onlyOneActivity?: boolean;

    // cancel popup request when we are sure that there is no need to authenticate
    // Method gets called after run() fetch new Features but before trezor-link dispatch "acquire" event
    cancelPopupRequest?: () => any;

    keepSession?: boolean;
    useEmptyPassphrase?: boolean;
    useCardanoDerivation?: boolean;
};

const parseRunOptions = (options?: RunOptions): RunOptions => {
    if (!options) options = {};
    return options;
};

export interface DeviceEvents {
    [DEVICE.PIN]: (
        device: Device,
        b: PROTO.PinMatrixRequestType | undefined,
        callback: (err: any, pin: string) => void,
    ) => void;
    [DEVICE.WORD]: (
        device: Device,
        b: PROTO.WordRequestType,
        callback: (err: any, word: string) => void,
    ) => void;
    [DEVICE.PASSPHRASE]: (device: Device, callback: (response: any) => void) => void;
    [DEVICE.PASSPHRASE_ON_DEVICE]: () => void;
    [DEVICE.BUTTON]: (device: Device, payload: DeviceButtonRequestPayload) => void;
    [DEVICE.ACQUIRED]: () => void;
}

/**
 * @export
 * @class Device
 * @extends {EventEmitter}
 */
export class Device extends TypedEmitter<DeviceEvents> {
    transport: Transport;

    originalDescriptor: Descriptor;

    unreadableError?: string; // unreadable error like: HID device, LIBUSB_ERROR

    // @ts-expect-error: strictPropertyInitialization
    firmwareStatus: DeviceFirmwareStatus;

    firmwareRelease?: ReleaseInfo | null;

    // @ts-expect-error: strictPropertyInitialization
    features: Features;

    featuresNeedsReload = false;

    acquirePromise?: ReturnType<Transport['acquire']> = undefined;
    releasePromise?: ReturnType<Transport['release']> = undefined;

    runPromise?: Deferred<void> | null;

    loaded = false;

    inconsistent = false;

    firstRunPromise: Deferred<boolean>;

    activitySessionID?: string | null;

    commands?: DeviceCommands;

    keepSession = false;

    instance = 0;

    internalState: string[] = [];

    externalState: string[] = [];

    unavailableCapabilities: UnavailableCapabilities = {};

    networkTypeState: NETWORK.NetworkType[] = [];

    firmwareType?: FirmwareType;

    constructor(transport: Transport, descriptor: Descriptor) {
        super();

        // === immutable properties
        this.transport = transport;
        this.originalDescriptor = descriptor;

        // this will be released after first run
        this.firstRunPromise = createDeferred();
    }

    static fromDescriptor(transport: Transport, originalDescriptor: Descriptor) {
        const descriptor = { ...originalDescriptor, session: null };
        try {
            const device: Device = new Device(transport, descriptor);
            return device;
        } catch (error) {
            _log.error('Device.fromDescriptor', error);
            throw error;
        }
    }

    static createUnacquired(
        transport: Transport,
        descriptor: Descriptor,
        unreadableError?: string,
    ) {
        const device = new Device(transport, descriptor);
        device.unreadableError = unreadableError;
        return device;
    }

    async acquire() {
        this.acquirePromise = this.transport.acquire({
            input: {
                path: this.originalDescriptor.path,
                previous: this.originalDescriptor.session,
            },
        });
        const acquireResult = await this.acquirePromise.promise;
        this.acquirePromise = undefined;
        if (!acquireResult.success) {
            if (this.runPromise) {
                this.runPromise.reject(new Error(acquireResult.error));
                this.runPromise = null;
            }
            throw acquireResult.error;
        }

        const sessionID = acquireResult.payload;

        _log.debug('Expected session id:', sessionID);
        this.activitySessionID = sessionID;
        // note: this.originalDescriptor is updated here and also in TRANSPORT.UPDATE listener.
        // I would like to update it only in one place (listener) but it some cases (unchained test),
        // listen response is not triggered by device acquire. not sure why.
        this.originalDescriptor.session = sessionID;

        if (this.commands) {
            this.commands.dispose();
        }
        this.commands = new DeviceCommands(this, this.transport, sessionID);
    }

    async release() {
        if (
            this.isUsedHere() &&
            !this.keepSession &&
            this.activitySessionID &&
            !this.releasePromise
        ) {
            if (this.commands) {
                this.commands.dispose();
                if (this.commands.callPromise) {
                    await this.commands.callPromise.promise;
                }
            }

            if (this.releasePromise) {
                await this.releasePromise;
            }
            this.releasePromise = this.transport.release({
                session: this.activitySessionID,
                path: this.originalDescriptor.path,
            });

            const releaseResponse = await this.releasePromise.promise;
            this.releasePromise = undefined;
            if (releaseResponse.success) {
                this.activitySessionID = null;
                this.originalDescriptor.session = null;
            }
        }
    }

    async cleanup() {
        this.removeAllListeners();
        // make sure that Device_CallInProgress will not be thrown
        this.runPromise = null;
        await this.release();
    }

    run(fn?: () => Promise<void>, options?: RunOptions) {
        if (this.runPromise) {
            _log.warn('Previous call is still running');
            throw ERRORS.TypedError('Device_CallInProgress');
        }

        options = parseRunOptions(options);

        this.runPromise = createDeferred(this._runInner.bind(this, fn, options));

        return this.runPromise.promise;
    }

    async override(error: Error) {
        if (this.acquirePromise) {
            await this.acquirePromise.promise;
        }

        if (this.runPromise) {
            await this.interruptionFromUser(error);
        }
        if (this.releasePromise) {
            await this.releasePromise.promise;
        }
    }

    async interruptionFromUser(error: Error) {
        _log.debug('interruptionFromUser');

        if (this.runPromise) {
            // reject inner defer
            this.runPromise.reject(error);
            this.runPromise = null;
        }
        if (this.commands) {
            await this.commands.cancel();
        }
    }

    /**
     * TODO: this does not work properly (even before transport-refactor)
     * one of the problem here is, that this.runPromise.reject is caught in src/core finally block that triggers
     * device release. This is not right because we know that somebody else has already taken control of device
     * which means that session managament does not make sense anymore. releasing device, on the other hand
     * makes sense, because this instance of connect might be the only one who has the right to do it.
     */
    interruptionFromOutside() {
        _log.debug('interruptionFromOutside');

        if (this.commands) {
            this.commands.dispose();
        }
        if (this.runPromise) {
            this.runPromise.reject(ERRORS.TypedError('Device_UsedElsewhere'));
            this.runPromise = null;
        }

        // session was acquired by another instance. but another might not have power to release interface
        // so it only notified about its session acquiral and the interrupted instance shoud cooperata
        // and release device too.
        this.transport.releaseDevice(this.originalDescriptor.path);
    }

    async _runInner<X>(fn: (() => Promise<X>) | undefined, options: RunOptions): Promise<void> {
        // typically when using cancel/override, device might be releasing
        // note: I am tempted to do this check at the begining of device.acquire but on the other hand I would like
        // to have methods as atomic as possible and shift responsibility for deciding when to call them on the caller
        if (this.releasePromise) {
            await this.releasePromise.promise;
        }

        if (!this.isUsedHere() || this.commands?.disposed || !this.getExternalState()) {
            // acquire session
            await this.acquire();

            // update features
            try {
                if (fn) {
                    await this.initialize(
                        !!options.useEmptyPassphrase,
                        !!options.useCardanoDerivation,
                    );
                } else {
                    // do not initialize while firstRunPromise otherwise `features.session_id` could be affected
                    // Edge-case: T1B1 + bootloader < 1.4.0 doesn't know the "GetFeatures" message yet and it will send no response to it
                    // transport response is pending endlessly, calling any other message will end up with "device call in progress"
                    // set the timeout for this call so whenever it happens "unacquired device" will be created instead
                    // next time device should be called together with "Initialize" (calling "acquireDevice" from the UI)
                    await Promise.race([
                        this.getFeatures(),
                        new Promise((_resolve, reject) =>
                            setTimeout(() => reject(new Error('GetFeatures timeout')), 3000),
                        ),
                    ]);
                }
            } catch (error) {
                // note: this happens on T1B1 with webusb if there was "select wallet dialog" and user reloads page.
                // note this happens even before transport-refactor-2 branch
                if (!this.inconsistent && error.message === 'GetFeatures timeout') {
                    // handling corner-case T1B1 + bootloader < 1.4.0 (above)
                    // if GetFeatures fails try again
                    // this time add empty "fn" param to force Initialize message
                    this.inconsistent = true;
                    return this._runInner(() => Promise.resolve({}), options);
                }
                this.inconsistent = true;
                this.runPromise = null;
                return Promise.reject(
                    ERRORS.TypedError(
                        'Device_InitializeFailed',
                        `Initialize failed: ${error.message} ${
                            error.code ? `, code: ${error.code}` : ''
                        }`,
                    ),
                );
            }
        }

        // if keepSession is set do not release device
        // until method with keepSession: false will be called
        if (options.keepSession) {
            this.keepSession = true;
        }

        // if we were waiting for device to be acquired, it should be guaranteed here that it had already happened
        // (features are reloaded too)
        if (this.listeners(DEVICE.ACQUIRED).length > 0) {
            this.emit(DEVICE.ACQUIRED);
        }

        // call inner function
        if (fn) {
            await fn();
        }

        // reload features
        if (this.loaded && this.features && !options.skipFinalReload) {
            await this.getFeatures();
        }

        if (
            (!this.keepSession && typeof options.keepSession !== 'boolean') ||
            options.keepSession === false
        ) {
            this.keepSession = false;
            await this.release();
        }

        if (this.runPromise) {
            this.runPromise.resolve();
        }

        this.runPromise = null;

        if (!this.loaded) {
            this.loaded = true;
            this.firstRunPromise.resolve(true);
        }
    }

    getCommands() {
        if (!this.commands) {
            throw ERRORS.TypedError('Runtime', `Device: commands not defined`);
        }
        return this.commands;
    }

    setInstance(instance = 0) {
        if (this.instance !== instance) {
            // if requested instance is different than current
            // and device wasn't released in previous call (example: interrupted discovery which set "keepSession" to true but never released)
            // clear "keepSession" and reset "activitySessionID" to ensure that "initialize" will be called
            if (this.keepSession) {
                this.activitySessionID = null;
                this.keepSession = false;
            }

            // T1B1: forget passphrase cached in internal state
            if (this.isT1() && this.useLegacyPassphrase()) {
                this.setInternalState(undefined);
            }
        }
        this.instance = instance;
    }

    getInstance() {
        return this.instance;
    }

    setInternalState(state?: string) {
        if (typeof state !== 'string') {
            delete this.internalState[this.instance];
        } else {
            this.internalState[this.instance] = state;
        }
    }

    getInternalState() {
        return this.internalState[this.instance];
    }

    setExternalState(state?: string) {
        if (typeof state !== 'string') {
            delete this.internalState[this.instance];
            delete this.externalState[this.instance];
        } else {
            this.externalState[this.instance] = state;
        }
    }

    getExternalState() {
        return this.externalState[this.instance];
    }

    async validateState(networkType?: NETWORK.NetworkType, preauthorized = false) {
        if (!this.features) return;

        if (!this.features.unlocked && preauthorized) {
            // NOTE: auto locked device accepts preauthorized methods (authorizeConjoin, getOwnershipProof, signTransaction) without pin request.
            // in that case it's enough to check if session_id is preauthorized...
            if (await this.getCommands().preauthorize(false)) {
                return;
            }
            // ...and if it's not then unlock device and proceed to regular GetAddress flow
        }

        const altMode = this._altModeChange(networkType);
        const expectedState = altMode ? undefined : this.getExternalState();
        const state = await this.getCommands().getDeviceState(networkType);
        const uniqueState = `${state}@${this.features.device_id || 'device_id'}:${this.instance}`;
        if (!this.useLegacyPassphrase() && this.features.session_id) {
            this.setInternalState(this.features.session_id);
        }
        if (expectedState && expectedState !== uniqueState) {
            return uniqueState;
        }
        if (!expectedState) {
            this.setExternalState(uniqueState);
        }
    }

    useLegacyPassphrase() {
        return !this.atLeast(['1.9.0', '2.3.0']);
    }

    async initialize(useEmptyPassphrase: boolean, useCardanoDerivation: boolean) {
        let payload: PROTO.Initialize | undefined;
        if (this.features) {
            const legacy = this.useLegacyPassphrase();
            const internalState = this.getInternalState();
            payload = {};
            // If the user has BIP-39 seed, and Initialize(derive_cardano=True) is not sent,
            // all Cardano calls will fail because the root secret will not be available.
            payload.derive_cardano = useCardanoDerivation;
            if (!legacy && internalState) {
                payload.session_id = internalState;
            }
            if (legacy && !this.isT1()) {
                payload.session_id = internalState;
                if (useEmptyPassphrase) {
                    payload._skip_passphrase = useEmptyPassphrase;
                    payload.session_id = undefined;
                }
            }
        }

        const { message } = await this.getCommands().typedCall('Initialize', 'Features', payload);
        this._updateFeatures(message);
    }

    async getFeatures() {
        const { message } = await this.getCommands().typedCall('GetFeatures', 'Features', {});
        message.capabilities = [...message.capabilities, 'Capability_Solana']; // TODO(vl): mock capability
        this._updateFeatures(message);
    }

    _updateFeatures(feat: Features) {
        const capabilities = parseCapabilities(feat);
        feat.capabilities = capabilities;
        const version = [feat.major_version, feat.minor_version, feat.patch_version];
        // capabilities could change in case where features was fetched with older version of messages.json which doesn't know this field
        const capabilitiesDidChange =
            this.features &&
            this.features.capabilities &&
            this.features.capabilities.join('') !== capabilities.join('');
        // check if FW version or capabilities did change
        if (versionCompare(version, this.getVersion()) !== 0 || capabilitiesDidChange) {
            this.unavailableCapabilities = getUnavailableCapabilities(feat, getAllNetworks());
            this.firmwareStatus = getFirmwareStatus(feat);
            this.firmwareRelease = getRelease(feat);
        }
        // GetFeatures doesn't return 'session_id'
        if (this.features && this.features.session_id && !feat.session_id) {
            feat.session_id = this.features.session_id;
        }
        feat.unlocked = feat.unlocked ?? true;
        // fix inconsistency of revision attribute between T1B1 and old T2T1 fw
        const revision = parseRevision(feat);
        feat.revision = revision;

        // Fix missing model and internal_model in older fw, model has to be fixed first
        // 1. - old T1B1 is missing features.model
        if (!feat.model && feat.major_version === 1) {
            feat.model = '1';
        }
        // 2. - old fw does not include internal_model. T1B1 does not report it yet, T2T1 starts in 2.6.0, T2B1 reports it from beginning
        if (!feat.internal_model) {
            feat.internal_model = ensureInternalModelFeature(feat.model);
        }

        this.features = feat;
        this.featuresNeedsReload = false;

        // Firmware type is unknown in bootloader mode
        if (this.getMode() !== 'bootloader') {
            this.firmwareType =
                feat.capabilities &&
                feat.capabilities.length > 0 &&
                !feat.capabilities.includes('Capability_Bitcoin_like')
                    ? FirmwareType.BitcoinOnly
                    : FirmwareType.Regular;
        }
    }

    isUnacquired() {
        return this.features === undefined;
    }

    disconnect() {
        // TODO: cleanup everything
        _log.debug('Disconnect cleanup');

        this.activitySessionID = null; // set to null to prevent transport.release
        this.interruptionFromUser(ERRORS.TypedError('Device_Disconnected'));
        this.runPromise = null;
    }

    isBootloader() {
        return this.features && !!this.features.bootloader_mode;
    }

    isInitialized() {
        return this.features && !!this.features.initialized;
    }

    isSeedless() {
        return this.features && !!this.features.no_backup;
    }

    isInconsistent() {
        return this.inconsistent;
    }

    getVersion() {
        if (!this.features) return [];
        return [
            this.features.major_version,
            this.features.minor_version,
            this.features.patch_version,
        ];
    }

    atLeast(versions: string[] | string) {
        if (!this.features) return false;
        const modelVersion =
            typeof versions === 'string' ? versions : versions[this.features.major_version - 1];
        return versionCompare(this.getVersion(), modelVersion) >= 0;
    }

    isUsed() {
        return typeof this.originalDescriptor.session === 'string';
    }

    isUsedHere() {
        return this.isUsed() && this.originalDescriptor.session === this.activitySessionID;
    }

    isUsedElsewhere() {
        return this.isUsed() && !this.isUsedHere();
    }

    isRunning() {
        return !!this.runPromise;
    }

    isLoaded() {
        return this.loaded;
    }

    waitForFirstRun() {
        return this.firstRunPromise.promise;
    }

    getDevicePath() {
        return this.originalDescriptor.path;
    }

    isT1() {
        return this.features ? this.features.major_version === 1 : false;
    }

    hasUnexpectedMode(allow: string[], require: string[]) {
        // both allow and require cases might generate single unexpected mode
        if (this.features) {
            // allow cases
            if (this.isBootloader() && !allow.includes(UI.BOOTLOADER)) {
                return UI.BOOTLOADER;
            }
            if (!this.isInitialized() && !allow.includes(UI.INITIALIZE)) {
                return UI.INITIALIZE;
            }
            if (this.isSeedless() && !allow.includes(UI.SEEDLESS)) {
                return UI.SEEDLESS;
            }

            // require cases
            if (!this.isBootloader() && require.includes(UI.BOOTLOADER)) {
                return UI.NOT_IN_BOOTLOADER;
            }
        }
        return null;
    }

    dispose() {
        this.removeAllListeners();
        if (this.isUsedHere() && this.activitySessionID) {
            try {
                if (this.commands) {
                    this.commands.cancel();
                }

                return this.transport.release({
                    session: this.activitySessionID,
                    path: this.originalDescriptor.path,
                    onClose: true,
                });
            } catch (err) {
                // empty
            }
        }
    }

    getMode() {
        if (this.features.bootloader_mode) return 'bootloader';
        if (!this.features.initialized) return 'initialize';
        if (this.features.no_backup) return 'seedless';
        return 'normal';
    }

    // simplified object to pass via postMessage
    toMessageObject(): DeviceTyped {
        if (this.unreadableError) {
            return {
                type: 'unreadable',
                path: this.originalDescriptor.path,
                error: this.unreadableError, // provide error details
                label: 'Unreadable device',
            };
        }
        if (this.isUnacquired()) {
            return {
                type: 'unacquired',
                path: this.originalDescriptor.path,
                label: 'Unacquired device',
            };
        }
        const defaultLabel = 'My Trezor';
        const label =
            this.features.label === '' || !this.features.label ? defaultLabel : this.features.label;
        let status: DeviceStatus = this.isUsedElsewhere() ? 'occupied' : 'available';
        if (this.featuresNeedsReload) status = 'used';
        return {
            type: 'acquired',
            id: this.features.device_id || null,
            path: this.originalDescriptor.path,
            label,
            state: this.getExternalState(),
            status,
            mode: this.getMode(),
            firmware: this.firmwareStatus,
            firmwareRelease: this.firmwareRelease,
            firmwareType: this.firmwareType,
            features: this.features,
            unavailableCapabilities: this.unavailableCapabilities,
        };
    }

    _getNetworkTypeState() {
        return this.networkTypeState[this.instance];
    }

    _setNetworkTypeState(networkType?: NETWORK.NetworkType) {
        if (typeof networkType !== 'string') {
            delete this.networkTypeState[this.instance];
        } else {
            this.networkTypeState[this.instance] = networkType;
        }
    }

    _altModeChange(networkType?: NETWORK.NetworkType) {
        const prevAltMode = this._isAltModeNetworkType(this._getNetworkTypeState());
        const nextAltMode = this._isAltModeNetworkType(networkType);

        // Update network type
        this._setNetworkTypeState(networkType);

        return prevAltMode !== nextAltMode;
    }

    // Is it a network type that requires the device to operate in an alternative state (ie: Cardano)
    _isAltModeNetworkType(networkType?: keyof typeof NETWORK.TYPES) {
        return networkType ? ['cardano'].includes(networkType) : false;
    }

    async legacyForceRelease() {
        if (this.isUsedHere()) {
            await this.acquire();
            await this.getFeatures();
            await this.release();
        }
    }
}
