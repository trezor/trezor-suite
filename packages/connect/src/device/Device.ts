// original file https://github.com/trezor/connect/blob/develop/src/js/device/Device.js

import EventEmitter from 'events';
import { DeviceCommands } from './DeviceCommands';
import { PROTO, ERRORS, NETWORK } from '../constants';
import { DEVICE, DeviceButtonRequestPayload, UI } from '../events';
import { getAllNetworks } from '../data/coinInfo';
import { getFirmwareStatus, getRelease } from '../data/firmwareInfo';
import {
    parseCapabilities,
    getUnavailableCapabilities,
    parseRevision,
} from '../utils/deviceFeaturesUtils';
import { versionCompare } from '../utils/versionUtils';
import { create as createDeferred, Deferred } from '../utils/deferred';
import { initLog } from '../utils/debug';
import type { Transport, Descriptor } from '@trezor/transport';
import type {
    Device as DeviceTyped,
    DeviceFirmwareStatus,
    DeviceStatus,
    Features,
    ReleaseInfo,
    UnavailableCapabilities,
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
    [DEVICE.PIN]: [Device, PROTO.PinMatrixRequestType | undefined, (err: any, pin: string) => void];
    [DEVICE.WORD]: [Device, PROTO.WordRequestType, (err: any, word: string) => void];
    [DEVICE.PASSPHRASE]: [Device, (response: any) => void];
    [DEVICE.PASSPHRASE_ON_DEVICE]: [Device, ((response: any) => void)?];
    [DEVICE.BUTTON]: [Device, DeviceButtonRequestPayload];
    [DEVICE.ACQUIRED]: [];
}

export interface Device {
    on<K extends keyof DeviceEvents>(type: K, listener: (...event: DeviceEvents[K]) => void): this;
    off<K extends keyof DeviceEvents>(type: K, listener: (...event: DeviceEvents[K]) => void): this;
    emit<K extends keyof DeviceEvents>(type: K, ...args: DeviceEvents[K]): boolean;
}

/**
 * @export
 * @class Device
 * @extends {EventEmitter}
 */
export class Device extends EventEmitter {
    transport: Transport;

    originalDescriptor: Descriptor;

    unreadableError?: string; // unreadable error like: HID device, LIBUSB_ERROR

    // @ts-expect-error: strictPropertyInitialization
    firmwareStatus: DeviceFirmwareStatus;

    firmwareRelease?: ReleaseInfo | null;

    // @ts-expect-error: strictPropertyInitialization
    features: Features;

    featuresNeedsReload = false;

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

    firmwareType: 'regular' | 'bitcoin-only' = 'regular';

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
        console.log('device.acquire calling!', this.originalDescriptor);

        const { promise } = this.transport.acquire({
            input: {
                path: this.originalDescriptor.path,
                previous: this.originalDescriptor.session,
            },
        });
        const acquireResult = await promise;
        console.log('device.acquire acquireResult', acquireResult)
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
        if (this.isUsedHere() && !this.keepSession && this.activitySessionID) {
            if (this.commands) {
                this.commands.dispose();
                if (this.commands.callPromise) {
                    try {
                        await this.commands.callPromise;
                    } catch (error) {
                        this.commands.callPromise = undefined;
                    }
                }
            }
            const releaseResponse = await this.transport.release(this.activitySessionID, false)
                .promise;

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
        console.log('cleanup release')
        await this.release();
    }

    run(fn?: () => Promise<void>, options?: RunOptions) {
        if (this.runPromise) {
            _log.warn('Previous call is still running');
            throw ERRORS.TypedError('Device_CallInProgress');
        }

        options = parseRunOptions(options);
        console.log('device.run')
        this.runPromise = createDeferred(this._runInner.bind(this, fn, options));

        return this.runPromise.promise;
    }

    async override(error: Error) {
        if (this.runPromise) {
            await this.interruptionFromUser(error);
        }
    }

    async interruptionFromUser(error: Error) {
        _log.debug('interruptionFromUser');
        if (this.commands) {
            await this.commands.cancel();
            this.commands.dispose();
        }
        if (this.runPromise) {
            // reject inner defer
            this.runPromise.reject(error);
            this.runPromise = null;
        }
    }

    interruptionFromOutside() {
        console.log('interruptionFromOutside')
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
        if (!this.isUsedHere() || this.commands?.disposed || !this.getExternalState()) {
            // acquire session
            console.log('device_runInner -> acquire')
            await this.acquire();
            console.log('device_runInner -> acquire DONE')

            // update features
            try {
                if (fn) {
                    await this.initialize(
                        !!options.useEmptyPassphrase,
                        !!options.useCardanoDerivation,
                    );
                } else {
                    // do not initialize while firstRunPromise otherwise `features.session_id` could be affected
                    // Corner-case: T1 + bootloader < 1.4.0 doesn't know the "GetFeatures" message yet and it will send no response to it
                    // transport response is pending endlessly, calling any other message will end up with "device call in progress"
                    // set the timeout for this call so whenever it happens "unacquired device" will be created instead
                    // next time device should be called together with "Initialize" (calling "acquireDevice" from the UI)
                    await Promise.race([
                        this.getFeatures(),
                        new Promise((_resolve, reject) =>
                            setTimeout(() => reject(new Error('GetFeatures timeout')), 7000),
                        ),
                    ]);
                }
            } catch (error) {
                if (!this.inconsistent && error.message === 'GetFeatures timeout') {
                    console.log('device_runInner => catch error', error);

                    // handling corner-case T1 + bootloader < 1.4.0 (above)
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
                        `Initialize failed: ${error.message} ${error.code? `, code: ${error.code}`:''}`,
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
            console.log('runInner release')
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

            // T1: forget passphrase cached in internal state
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
        // fix inconsistency of revision attribute between T1 and T2
        const revision = parseRevision(feat);
        feat.revision = revision;

        // old T1 is missing features.model
        if (!feat.model && feat.major_version === 1) {
            feat.model = '1';
        }

        this.features = feat;
        this.featuresNeedsReload = false;

        this.firmwareType =
            feat.capabilities &&
            feat.capabilities.length > 0 &&
            !feat.capabilities.includes('Capability_Bitcoin_like')
                ? 'bitcoin-only'
                : 'regular';
    }

    isUnacquired() {
        return this.features === undefined;
    }

    disconnect() {
        // TODO: cleanup everything
        _log.debug('Disconnect cleanup');

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

                console.log("release from device.dispose()")
                this.transport.releaseDevice(this.originalDescriptor.path);
                
                return this.transport.release(this.activitySessionID, true);
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
            console.log('device legacyForceRelease => acquire')
            await this.acquire();
            await this.getFeatures();
            await this.release();
        }
    }
}
