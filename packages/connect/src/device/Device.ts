// original file https://github.com/trezor/connect/blob/develop/src/js/device/Device.js
import { randomBytes } from 'crypto';

import { DeviceModelInternal, models } from '@trezor/device-utils';
import { TransportProtocol, thp as protocolThp, v1 as protocolV1 } from '@trezor/protocol';
import { Session, TRANSPORT, TRANSPORT_ERROR } from '@trezor/transport';
import { type Descriptor, type Transport } from '@trezor/transport';
import { TransportDeviceEvent } from '@trezor/transport/src/transports/abstract';
import {
    Deferred,
    TypedEmitter,
    createDeferred,
    isArrayMember,
    resolveAfter,
    serializeError,
    versionUtils,
} from '@trezor/utils';

import { DeviceCommands } from './DeviceCommands';
import { ERRORS, FIRMWARE, PROTO } from '../constants';
import { DeviceCurrentSession, TypedCallProvider } from './DeviceCurrentSession';
import { IStateStorage } from './StateStorage';
import { checkFirmwareRevision } from './checkFirmwareRevision';
import { calculateFirmwareHash, getBinaryOptional, stripFwHeaders } from '../api/firmware';
import { DataManager } from '../data/DataManager';
import { getAllNetworks } from '../data/coinInfo';
import { getFirmwareStatus, getRelease, getReleaseInfo, getReleases } from '../data/firmwareInfo';
import { getLanguage } from '../data/getLanguage';
import {
    DEVICE,
    DeviceButtonRequestPayload,
    DeviceThpCredentialsChangedPayload,
    DeviceThpPairingPayload,
    DeviceVersionChanged,
    UI,
    UiResponsePassphrase,
    UiResponsePin,
    UiResponseThpPairingTag,
    UiResponseWord,
} from '../events';
import {
    DeviceFirmwareStatus,
    DeviceState,
    DeviceStatus,
    Device as DeviceTyped,
    DeviceUniquePath,
    Features,
    FirmwareHashCheckError,
    FirmwareHashCheckResult,
    FirmwareType,
    KnownDevice,
    ReleaseInfo,
    UnavailableCapabilities,
    VersionArray,
} from '../types';
import { initLog } from '../utils/debug';
import {
    ensureInternalModelFeature,
    getUnavailableCapabilities,
    parseCapabilities,
    parseRevision,
} from '../utils/deviceFeaturesUtils';

// custom log
const _log = initLog('Device');

type RunOptions = {
    // skipFinalReload - normally, after action, features are reloaded again
    //                   because some actions modify the features
    //                   but sometimes, you don't need that and can skip that
    skipFinalReload?: boolean;
    keepSession?: boolean;
    useCardanoDerivation?: boolean;
    skipFirmwareChecks?: boolean;
    skipLanguageChecks?: boolean;
};

export const CANCEL_TIMEOUT = 1_000;
export const GET_FEATURES_TIMEOUT = 3_000;
// Due to performance issues in suite-native during app start, original timeout is not sufficient.
export const GET_FEATURES_TIMEOUT_REACT_NATIVE = 20_000;

type Result<T> = { success: true; payload: T } | { success: false; error: Error };

export interface DeviceEvents {
    [DEVICE.PIN]: {
        type: PROTO.PinMatrixRequestType | undefined;
        callback: (response: Result<UiResponsePin['payload']>) => void;
    };
    [DEVICE.WORD]: {
        type: PROTO.WordRequestType;
        callback: (response: Result<UiResponseWord['payload']>) => void;
    };
    [DEVICE.PASSPHRASE]: {
        callback: (response: Result<UiResponsePassphrase['payload']>) => void;
    };
    [DEVICE.PASSPHRASE_ON_DEVICE]: void;
    [DEVICE.BUTTON]: { device: Device; payload: DeviceButtonRequestPayload };
    [DEVICE.FIRMWARE_VERSION_CHANGED]: DeviceVersionChanged['payload'];
    [DEVICE.THP_PAIRING]: {
        payload: DeviceThpPairingPayload;
        callback: (response: Result<UiResponseThpPairingTag['payload']>) => void;
    };
    [DEVICE.THP_CREDENTIALS_CHANGED]: DeviceThpCredentialsChangedPayload;
}

type DeviceLifecycle =
    | typeof DEVICE.CONNECT
    | typeof DEVICE.CONNECT_UNACQUIRED
    | typeof DEVICE.DISCONNECT
    | typeof DEVICE.CHANGED;

type DeviceLifecycleListener = (lifecycle: DeviceLifecycle) => void;

type DeviceParams = {
    id: DeviceUniquePath;
    transport: Transport;
    descriptor: Descriptor;
    listener: DeviceLifecycleListener;
};

export class Device extends TypedEmitter<DeviceEvents> {
    public readonly transport: Transport;
    public readonly transportPath;
    public readonly bluetoothProps;
    private thp: protocolThp.ThpState | undefined;
    private readonly transportDescriptorType;
    private sessionAcquired: Session | null;

    // protocol related
    private _protocol: TransportProtocol;
    public get protocol() {
        return this._protocol;
    }

    public getThpState() {
        return this.thp;
    }

    /**
     * descriptor was detected on transport layer but sending any messages (such as GetFeatures) to it failed either
     * with some expected error, for example HID device, LIBUSB_ERROR, or it simply timeout out. such device can't be worked
     * with and user needs to take some action. for example reconnect the device, update firmware or change transport type
     */
    private unreadableError?: string;

    // @ts-expect-error: strictPropertyInitialization
    private _firmwareStatus: DeviceFirmwareStatus;
    public get firmwareStatus() {
        return this._firmwareStatus;
    }

    private _firmwareRelease?: ReleaseInfo | null;
    public get firmwareRelease() {
        return this._firmwareRelease;
    }

    // @ts-expect-error: strictPropertyInitialization
    private _features: Features;
    public get features() {
        return this._features;
    }

    private wasUsedElsewhere = false;

    // variables used in one workflow: acquire -> transportSession -> commands -> run -> keepTransportSession -> release
    private acquirePromise?: ReturnType<Transport['acquire']>;
    private releasePromise?: ReturnType<Transport['release']>;

    private runAbort?: AbortController;
    private runPromise?: Promise<void>;

    private keepTransportSession = false;
    private currentSession?: DeviceCurrentSession;

    private instance = 0;

    // DeviceState list [this.instance]: DeviceState | undefined
    private state: DeviceState[] = [];
    private stateStorage?: IStateStorage = undefined;

    private _unavailableCapabilities: UnavailableCapabilities = {};
    public get unavailableCapabilities(): Readonly<UnavailableCapabilities> {
        return this._unavailableCapabilities;
    }

    private _firmwareType?: FirmwareType;
    public get firmwareType() {
        return this._firmwareType;
    }

    private name = 'Trezor';

    private color?: string;

    private availableTranslations: string[] = [];

    private authenticityChecks: NonNullable<KnownDevice['authenticityChecks']> = {
        firmwareRevision: null,
        firmwareHash: null,
    };

    private readonly uniquePath;

    private emitLifecycle;

    private sessionDfd?: Deferred<Session | null>;

    // todo: marek will solve this
    public handshakeFinished = false;

    constructor({ id, transport, descriptor, listener }: DeviceParams) {
        super();

        this.emitLifecycle = listener;
        this._protocol = protocolV1;

        // === immutable properties
        this.uniquePath = id;
        this.transport = transport;
        this.transportPath = descriptor.path;
        this.transportDescriptorType = descriptor.type;
        this.bluetoothProps = descriptor.id ? { id: descriptor.id } : undefined;

        this.sessionAcquired = null;

        transport.on(TRANSPORT.STOPPED, this.onTransportStopped);
        transport.deviceEvents.on(this.transportPath, this.onTransportDeviceEvent);
    }

    private readonly onTransportStopped = () => this.disconnect();

    private readonly onTransportDeviceEvent = (event: TransportDeviceEvent) => {
        switch (event.type) {
            case TRANSPORT.DEVICE_SESSION_CHANGED:
                return this.updateDescriptor(event.descriptor);
            case TRANSPORT.DEVICE_REQUEST_RELEASE:
                return this.usedElsewhere();
            case TRANSPORT.DEVICE_DISCONNECTED: {
                return this.disconnect();
            }
        }
    };

    private getSessionChangePromise() {
        if (!this.sessionDfd) {
            this.sessionDfd = createDeferred();
            this.sessionDfd.promise
                .catch(() => {}) // So there isn't potential unhandled reject
                .finally(() => {
                    this.sessionDfd = undefined;
                });
        }

        return this.sessionDfd.promise;
    }

    private async waitAndCompareSession<
        T extends { success: true; payload: Session | null } | { success: false },
    >(response: T, sessionPromise: Promise<Session | null>) {
        if (response.success) {
            try {
                if ((await sessionPromise) !== response.payload) {
                    return {
                        success: false,
                        error: TRANSPORT_ERROR.SESSION_WRONG_PREVIOUS,
                    } as const;
                }
            } catch {
                return {
                    success: false,
                    error: TRANSPORT_ERROR.DEVICE_DISCONNECTED_DURING_ACTION,
                } as const;
            }
        }

        return response;
    }

    acquire() {
        const sessionPromise = this.getSessionChangePromise();
        const previous = this.transport.getDescriptor(this.transportPath)?.session ?? null;

        this.acquirePromise = this.transport
            .acquire({ input: { path: this.transportPath, previous } })
            .then(result => this.waitAndCompareSession(result, sessionPromise))
            .then(result => {
                if (result.success) {
                    this.wasUsedElsewhere = false;
                    this.sessionAcquired = result.payload;
                    this.currentSession = new DeviceCurrentSession(
                        this,
                        this.transport,
                        this.sessionAcquired,
                    );

                    return result;
                } else {
                    throw new Error(result.error);
                }
            })
            .finally(() => {
                this.acquirePromise = undefined;
            });

        return this.acquirePromise;
    }

    release() {
        if (!this.sessionAcquired || this.keepTransportSession || this.releasePromise) {
            return;
        }

        const sessionPromise = this.getSessionChangePromise();

        this.releasePromise = this.transport
            .release({ session: this.sessionAcquired, path: this.transportPath })
            .then(result => this.waitAndCompareSession(result, sessionPromise))
            .then(result => {
                if (result.success) {
                    this.sessionAcquired = null;
                }

                return result;
            })
            .finally(() => {
                this.releasePromise = undefined;
            });

        return this.releasePromise;
    }

    // call only once, right after device creation
    async handshake(delay?: number) {
        if (delay) {
            await resolveAfter(501 + delay);
        }

        while (true) {
            if (this.isUsedElsewhere()) {
                this.emitLifecycle(DEVICE.CONNECT_UNACQUIRED);
            } else {
                try {
                    await this.run();
                } catch (error) {
                    _log.warn(`device.run error.message: ${error.message}, code: ${error.code}`);

                    if (
                        error.code === 'Device_NotFound' ||
                        error.code === 'Device_Disconnected' ||
                        error.message === TRANSPORT_ERROR.DEVICE_NOT_FOUND ||
                        error.message === TRANSPORT_ERROR.DEVICE_DISCONNECTED_DURING_ACTION ||
                        error.message === TRANSPORT_ERROR.HTTP_ERROR // bridge died during device initialization
                    ) {
                        // disconnected, do nothing
                    } else if (
                        // we don't know what really happened
                        error.message === TRANSPORT_ERROR.UNEXPECTED_ERROR ||
                        // someone else took the device at the same time
                        error.message === TRANSPORT_ERROR.SESSION_WRONG_PREVIOUS ||
                        // device had some session when first seen -> we do not read it so that we don't interrupt somebody else's flow
                        error.code === 'Device_UsedElsewhere' ||
                        // TODO: is this needed? can't I just use transport error?
                        error.code === 'Device_InitializeFailed'
                    ) {
                        this.emitLifecycle(DEVICE.CONNECT_UNACQUIRED);
                    } else if (
                        // device was claimed by another application on transport api layer (claimInterface in usb nomenclature) but never released (releaseInterface in usb nomenclature)
                        // the only remedy for this is to reconnect device manually
                        error.message === TRANSPORT_ERROR.INTERFACE_UNABLE_TO_OPEN_DEVICE ||
                        // catch one of trezord LIBUSB_ERRORs
                        error.message?.indexOf(ERRORS.LIBUSB_ERROR_MESSAGE) >= 0
                    ) {
                        this.unreadableError = error?.message;
                        this.emitLifecycle(DEVICE.CONNECT_UNACQUIRED);
                    } else {
                        await resolveAfter(501);
                        continue;
                    }
                }
            }

            this.handshakeFinished = true;

            return;
        }
    }

    private async updateDescriptor(descriptor: Descriptor) {
        this.sessionDfd?.resolve(descriptor.session);

        await Promise.all([this.acquirePromise, this.releasePromise]);

        // TODO improve these conditions

        // Session changed to different than the current one
        // -> acquired by someone else
        if (descriptor.session && descriptor.session !== this.sessionAcquired) {
            this.usedElsewhere();
        }

        // Session changed to null
        // -> released
        if (!descriptor.session) {
            this.keepTransportSession = false;
        }

        this.emitLifecycle(DEVICE.CHANGED);
    }

    // TODO empty fn variant can be split/removed
    run(fn?: () => Promise<void>, options: RunOptions = {}) {
        if (this.runPromise) {
            _log.warn('Previous call is still running');
            throw ERRORS.TypedError('Device_CallInProgress');
        }

        const wasUnacquired = this.isUnacquired();

        this.runAbort = new AbortController();
        const { signal } = this.runAbort;

        this.runPromise = Promise.race([
            this._runInner(fn, options, signal),
            new Promise<never>((_, reject) => {
                signal.addEventListener('abort', () => reject(signal.reason));
            }),
        ])
            .catch(async err => {
                this.keepTransportSession = false;
                await this.acquirePromise;
                await this.release();

                throw err;
            })
            .finally(() => {
                this.runAbort = undefined;
                this.runPromise = undefined;
            })
            .then(() => {
                if (wasUnacquired && !this.isUnacquired()) {
                    this.emitLifecycle(DEVICE.CONNECT);
                }
            });

        return this.runPromise;
    }

    async interrupt(reason: Error) {
        await this.currentSession?.abort(reason);

        // reject inner defer
        this.runAbort?.abort(reason);

        await this.currentRun;
    }

    get currentRun() {
        return this.runPromise?.catch(() => {});
    }

    private usedElsewhere() {
        this.wasUsedElsewhere = true;

        // only makes sense to continue when device held by this instance
        if (!this.sessionAcquired) {
            return;
        }

        // session was acquired by another instance. but another might not have power to release interface
        // so it only notified about its session acquiral and the interrupted instance should cooperate
        // and release device too.
        this.transport.releaseDevice(this.sessionAcquired);
        this.sessionAcquired = null;

        _log.debug('interruptionFromOutside');

        this.runAbort?.abort(ERRORS.TypedError('Device_UsedElsewhere'));
    }

    private async _runInner<X>(
        fn: (() => Promise<X>) | undefined,
        options: RunOptions,
        abortSignal: AbortSignal,
    ): Promise<void> {
        // typically when using cancel/override, device might be releasing
        // note: I am tempted to do this check at the beginning of device.acquire but on the other hand I would like
        // to have methods as atomic as possible and shift responsibility for deciding when to call them on the caller
        if (this.releasePromise) {
            await this.releasePromise;
        }

        const acquireNeeded = !this.isUsedHere() || this.currentSession?.isDisposed();
        if (acquireNeeded) {
            // acquire session
            await this.acquire();
        }

        if (abortSignal.aborted) throw abortSignal.reason;

        const { staticSessionId, deriveCardano } = this.getState() || {};
        if (acquireNeeded || !staticSessionId || (!deriveCardano && options.useCardanoDerivation)) {
            // update features
            try {
                if (fn) {
                    await this.initialize(!!options.useCardanoDerivation);
                } else {
                    const isNative = DataManager.getSettings('env') === 'react-native';
                    const cancelTimeout = isNative
                        ? GET_FEATURES_TIMEOUT_REACT_NATIVE
                        : CANCEL_TIMEOUT;

                    // note 1: clear communication with the device using Cancel message. This causes any remaining messages in its transport stack to get flushed.
                    //         this case may happen when communication with the device was abruptly interrupted by unloading connect unexpectedly (example window reload)
                    // note 2: this problem should not occur for the upcoming trezor host protocol, so we limit this to v1 and bridge protocols
                    // note 3: in 99% of cases we send this message unnecessarily. as @Szymon pointed out, it might be better to catch this call and repeat it.
                    // note 4: this case can happen also in the 'if' branch. 1] reload app, 2], browser doesn't fire release in time, 3] you get unacquired device, 4] you click
                    //         the 'use device here' button and here you go. Yet I didn't want to burden every TrezorConnect method call with this but we may reconsider this.
                    // note 5: ad note 4. it is not so problematic anymore since cleanup on dispose has been improved in https://github.com/trezor/trezor-suite/pull/16930
                    // note 6: T1 with older bootloader (1.8.0) doesn't respond to Cancel message, so we better ignore those
                    if (
                        ['v1', 'bridge'].includes(this.protocol.name) &&
                        ![0, 2].includes(this.transportDescriptorType) // ignore model 1 hid or webusb bootloader mode
                    ) {
                        _log.debug(
                            'sending a preventive cancel on the first encounter with the device',
                        );

                        await Promise.race([
                            this.getCurrentSession().cancelCall(),
                            new Promise((_, reject) => setTimeout(reject, cancelTimeout)),
                        ]).catch(() => this.acquire());
                    }

                    await this.getFeatures();
                }
            } catch (error) {
                _log.warn('Device._runInner error: ', error.message);

                return Promise.reject(
                    ERRORS.TypedError(
                        'Device_InitializeFailed',
                        `Initialize failed: ${error.message}${
                            error.code ? `, code: ${error.code}` : ''
                        }`,
                    ),
                );
            }
        }

        if (!options.skipFirmwareChecks) {
            await this.checkFirmwareHashWithRetries();
            await this.checkFirmwareRevisionWithRetries();
        }

        if (
            !options.skipLanguageChecks &&
            this.features?.language &&
            !this.features.language_version_matches &&
            this.atLeast('2.7.0')
        ) {
            _log.info('language version mismatch. silently updating...');

            try {
                await this.changeLanguage({ language: this.features.language });
            } catch (err) {
                _log.error('change language failed silently', err);
            }
        }

        // if keepSession is set do not release device
        // until method with keepSession: false will be called
        if (options.keepSession) {
            this.keepTransportSession = true;
        }

        // call inner function
        if (fn) {
            await fn();

            // reload features
            if (!options.skipFinalReload) {
                await this.getFeatures();
            }
        }

        if (
            (!this.keepTransportSession && typeof options.keepSession !== 'boolean') ||
            options.keepSession === false
        ) {
            this.keepTransportSession = false;
            await this.release();
        }
    }

    getCurrentSession(): TypedCallProvider {
        if (!this.currentSession) {
            throw ERRORS.TypedError('Runtime', `Device: commands not defined`);
        }

        return this.currentSession;
    }

    getCommands() {
        return DeviceCommands(this.getCurrentSession());
    }

    setInstance(instance = 0) {
        if (this.instance !== instance) {
            // if requested instance is different than current
            // and device wasn't released in previous call (example: interrupted discovery which set "keepSession" to true but never released)
            // clear "keepTransportSession" and reset "transportSession" to ensure that "initialize" will be called
            if (this.keepTransportSession) {
                this.sessionAcquired = null;
                this.keepTransportSession = false;
            }
        }
        this.instance = instance;
    }

    getInstance() {
        return this.instance;
    }

    getState(): DeviceState | undefined {
        return this.state[this.instance];
    }

    setState(state?: Partial<DeviceState>) {
        if (!state) {
            delete this.state[this.instance];
        } else {
            const prevState = this.state[this.instance];
            const newState = {
                ...prevState,
                ...state,
            };

            this.state[this.instance] = newState;
            this.stateStorage?.saveState(this, newState);
        }
    }

    async initialize(useCardanoDerivation: boolean) {
        let payload: PROTO.Initialize | undefined;
        if (this.features) {
            const { sessionId, deriveCardano } = this.getState() || {};
            // If the user has BIP-39 seed, and Initialize(derive_cardano=True) is not sent,
            // all Cardano calls will fail because the root secret will not be available.
            payload = {
                derive_cardano: deriveCardano || useCardanoDerivation,
            };
            if (sessionId) {
                payload.session_id = sessionId;
            }
        }

        const { message } = await this.getCurrentSession().typedCall(
            'Initialize',
            'Features',
            payload,
        );
        this._updateFeatures(message);
        this.setState({ deriveCardano: payload?.derive_cardano });
    }

    initStorage(storage: IStateStorage) {
        this.stateStorage = storage;
        this.setState(storage.loadState(this));
    }

    async getFeatures() {
        const { message } = await this.getCurrentSession().typedCall('GetFeatures', 'Features', {});
        this._updateFeatures(message);
    }

    private async checkFirmwareHashWithRetries() {
        const lastResult = this.authenticityChecks.firmwareHash;
        const notDoneYet = lastResult === null;
        const attemptsDone = lastResult?.attemptCount ?? 0;
        if (attemptsDone >= FIRMWARE.HASH_CHECK_MAX_ATTEMPTS) return;

        const wasError = lastResult !== null && !lastResult.success;
        const wasErrorRetriable =
            wasError && isArrayMember(lastResult.error, FIRMWARE.HASH_CHECK_RETRIABLE_ERRORS);
        const lastErrorPayload = wasError ? lastResult?.errorPayload : null;

        if (notDoneYet || wasErrorRetriable) {
            const result = await this.checkFirmwareHash();

            this.authenticityChecks = {
                ...this.authenticityChecks,
                firmwareHash: result,
            };

            if (result === null) return;
            result.attemptCount = attemptsDone + 1;

            // if it suceeeded only after a retry, and there was an `errorPayload` previously, we want to pass that information to suite
            if (result.success && lastErrorPayload) {
                result.warningPayload = { lastErrorPayload, successOnAttempt: result.attemptCount };
            }
        }
    }

    private async checkFirmwareHash(): Promise<FirmwareHashCheckResult | null> {
        const createFailResult = (error: FirmwareHashCheckError, errorPayload?: unknown) => ({
            success: false,
            error,
            errorPayload,
        });

        const baseUrl = DataManager.getSettings('binFilesBaseUrl');
        const enabled = DataManager.getSettings('enableFirmwareHashCheck');
        if (!enabled || baseUrl === undefined) return createFailResult('check-skipped');

        const firmwareVersion = this.getVersion();
        // device has no features (not yet connected) or no firmware
        if (firmwareVersion === undefined || !this.features || this.features.bootloader_mode) {
            return null;
        }

        const checkSupported = !this.unavailableCapabilities.getFirmwareHash;
        if (!checkSupported) return createFailResult('check-unsupported');

        const release = getReleases(this.features.internal_model).find(r =>
            versionUtils.isEqual(r.version, firmwareVersion),
        );
        // if version is expected to support hash check, but the release is unknown, then firmware is considered unofficial
        if (release === undefined) return createFailResult('unknown-release');

        const btcOnly = this.firmwareType === FirmwareType.BitcoinOnly;
        const binary = await getBinaryOptional({ baseUrl, btcOnly, release });
        // release was found, but not its binary - happens on desktop, where only local files are searched
        if (binary === null) {
            return createFailResult('check-unsupported');
        }
        // binary was found, but it's likely a git LFS pointer (can happen on dev) - see onCallFirmwareUpdate.ts
        if (binary.byteLength < 200) {
            _log.warn(`Firmware binary for hash check suspiciously small (< 200 b)`);

            return createFailResult('check-unsupported');
        }

        const strippedBinary = stripFwHeaders(binary);
        const { hash: expectedHash, challenge } = calculateFirmwareHash(
            this.features.major_version,
            strippedBinary,
            randomBytes(32),
        );

        // handle rejection of call by a counterfeit device. If unhandled, it crashes device initialization,
        // so device can't be used, but it's preferable to display proper message about counterfeit device
        try {
            const deviceResponse = await this.getCurrentSession().typedCall(
                'GetFirmwareHash',
                'FirmwareHash',
                { challenge },
            );
            if (!deviceResponse?.message?.hash) {
                return createFailResult('other-error', 'Device response is missing hash');
            }

            if (deviceResponse.message.hash !== expectedHash) {
                return createFailResult('hash-mismatch');
            }

            return { success: true };
        } catch (errorPayload) {
            return createFailResult('other-error', serializeError(errorPayload));
        }
    }

    private async checkFirmwareRevisionWithRetries() {
        const lastResult = this.authenticityChecks.firmwareRevision;
        const notDoneYet = lastResult === null;

        const wasError = lastResult !== null && !lastResult.success;
        const wasErrorRetriable =
            wasError && isArrayMember(lastResult.error, FIRMWARE.REVISION_CHECK_RETRIABLE_ERRORS);

        if (notDoneYet || wasErrorRetriable) {
            await this.checkFirmwareRevision();
        }
    }

    private async checkFirmwareRevision() {
        const firmwareVersion = this.getVersion();

        if (!firmwareVersion || !this.features) {
            return; // This happens when device has no features (not yet connected)
        }

        if (this.features.bootloader_mode === true) {
            return;
        }

        const release = getRelease(this.features.internal_model, firmwareVersion);

        const result = await checkFirmwareRevision({
            internalModel: this.features.internal_model,
            deviceRevision: this.features.revision,
            firmwareVersion,
            expectedRevision: release?.firmware_revision,
        });
        this.authenticityChecks = {
            ...this.authenticityChecks,
            firmwareRevision: result,
        };
    }

    async changeLanguage({
        language,
        binary,
    }: { language?: undefined; binary: ArrayBuffer } | { language: string; binary?: undefined }) {
        if (language === 'en-US') {
            return this._uploadTranslationData(null);
        }

        if (binary) {
            return this._uploadTranslationData(binary);
        }

        const version = this.getVersion();
        if (!version) {
            throw ERRORS.TypedError('Runtime', 'changeLanguage: device version unknown');
        }

        const downloadedBinary = await getLanguage({
            language,
            version,
            internal_model: this.features.internal_model,
        });

        if (!downloadedBinary) {
            throw ERRORS.TypedError('Runtime', 'changeLanguage: translation not found');
        }

        return this._uploadTranslationData(downloadedBinary);
    }

    private async _uploadTranslationData(payload: ArrayBuffer | null) {
        if (payload === null) {
            const response = await this.getCurrentSession().typedCall(
                'ChangeLanguage',
                ['Success'],
                { data_length: 0 }, // For en-US where we just send `ChangeLanguage(size=0)`
            );

            return response.message;
        }

        const length = payload.byteLength;

        let response = await this.getCurrentSession().typedCall(
            'ChangeLanguage',
            ['DataChunkRequest', 'Success'],
            { data_length: length },
        );

        while (response.type !== 'Success') {
            const start = response.message.data_offset!;
            const end = response.message.data_offset! + response.message.data_length!;
            const chunk = payload.slice(start, end);

            response = await this.getCurrentSession().typedCall(
                'DataChunkAck',
                ['DataChunkRequest', 'Success'],
                {
                    data_chunk: Buffer.from(chunk).toString('hex'),
                },
            );
        }

        return response.message;
    }

    private _updateFeatures(feat: Features) {
        const capabilities = parseCapabilities(feat);
        feat.capabilities = capabilities;
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
        // 2. - old fw does not include internal_model. T1B1 does not report it yet, T2T1 starts in 2.6.0
        //    - or reported internal_model is not known to connect
        if (!feat.internal_model || !DeviceModelInternal[feat.internal_model]) {
            feat.internal_model = ensureInternalModelFeature(feat.model);
        }

        const version = this.getVersion();
        const newVersion = [
            feat.major_version,
            feat.minor_version,
            feat.patch_version,
        ] satisfies VersionArray;

        // check if FW version or capabilities did change
        if (!version || !versionUtils.isEqual(version, newVersion)) {
            if (version) {
                this.emit(DEVICE.FIRMWARE_VERSION_CHANGED, {
                    oldVersion: version,
                    newVersion,
                    device: this.toMessageObject(),
                });
            }
            this._unavailableCapabilities = getUnavailableCapabilities(feat, getAllNetworks());
            this._firmwareStatus = getFirmwareStatus(feat);
            this._firmwareRelease = getReleaseInfo(feat);

            this.availableTranslations = this.firmwareRelease?.translations ?? [];
        }

        this._features = feat;

        // Vendor headers have been changed in 2.6.3.
        if (feat.fw_vendor === 'Trezor Bitcoin-only') {
            this._firmwareType = FirmwareType.BitcoinOnly;
        } else if (feat.fw_vendor === 'Trezor') {
            this._firmwareType = FirmwareType.Regular;
        } else if (this.getMode() !== 'bootloader') {
            // Relevant for T1B1, T2T1 and custom firmware with a different vendor header. Capabilities do not work in bootloader mode.
            this._firmwareType =
                feat.capabilities &&
                feat.capabilities.length > 0 &&
                !feat.capabilities.includes('Capability_Bitcoin_like')
                    ? FirmwareType.BitcoinOnly
                    : FirmwareType.Regular;
        }

        const deviceInfo = models[feat.internal_model] ?? {
            name: `Unknown ${feat.internal_model}`,
            colors: {},
        };

        this.name = deviceInfo.name;

        // todo: move to 553
        if (feat?.unit_color) {
            const deviceUnitColor = feat.unit_color.toString();

            if (deviceUnitColor in deviceInfo.colors) {
                this.color = (deviceInfo.colors as Record<string, string>)[deviceUnitColor];
            }
        }
    }

    prompt<
        T extends
            | typeof DEVICE.PIN
            | typeof DEVICE.PASSPHRASE
            | typeof DEVICE.WORD
            | typeof DEVICE.THP_PAIRING,
    >(type: T, args: Omit<DeviceEvents[T], 'callback'>) {
        // TODO I believe this emit/on can be changed into simple async functions
        return new Promise<Parameters<DeviceEvents[T]['callback']>[0]>(callback => {
            if (!this.listenerCount(type)) {
                const payload = {
                    success: false,
                    error: new Error(`${type} callback not configured`),
                } as const;
                callback(payload);
            } else {
                // @ts-expect-error
                this.emit(type, { callback, ...args });
            }
        });
    }

    isUnacquired() {
        return this.features === undefined;
    }

    isUnreadable() {
        return !!this.unreadableError;
    }

    private disconnect() {
        _log.debug('Disconnect cleanup');

        this.transport.off(TRANSPORT.STOPPED, this.onTransportStopped);
        this.transport.deviceEvents.off(this.transportPath, this.onTransportDeviceEvent);
        this.removeAllListeners();

        this.sessionDfd?.reject(new Error());

        if (this.sessionAcquired) {
            this.transport.releaseSync(this.sessionAcquired);
            this.sessionAcquired = null; // set to null to prevent transport.release and cancelableAction
        }

        this.emitLifecycle(DEVICE.DISCONNECT);
        this.emitLifecycle = () => {};

        return this.interrupt(ERRORS.TypedError('Device_Disconnected'));
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

    getVersion(): VersionArray | undefined {
        if (!this.features) return;

        return [
            this.features.major_version,
            this.features.minor_version,
            this.features.patch_version,
        ];
    }

    atLeast(versions: string[] | string) {
        const version = this.getVersion();
        if (!this.features || !version) return false;
        const modelVersion =
            typeof versions === 'string' ? versions : versions[this.features.major_version - 1];

        return versionUtils.isNewerOrEqual(version, modelVersion);
    }

    isUsed() {
        return !!this.transport.getDescriptor(this.transportPath)?.session;
    }

    isUsedHere() {
        return !!this.sessionAcquired;
    }

    isUsedElsewhere() {
        return this.isUsed() && !this.isUsedHere();
    }

    getUniquePath() {
        return this.uniquePath;
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

    private getMode() {
        if (this.features.bootloader_mode) return 'bootloader';
        if (!this.features.initialized) return 'initialize';
        if (this.features.no_backup) return 'seedless';

        return 'normal';
    }

    // simplified object to pass via postMessage
    toMessageObject(): DeviceTyped {
        const { name, uniquePath: path } = this;
        const base = { path, name };

        if (this.unreadableError) {
            return {
                ...base,
                type: 'unreadable',
                error: this.unreadableError, // provide error details
                label: 'Unreadable device',
                transportDescriptorType: this.transportDescriptorType,
            };
        }
        if (this.isUnacquired()) {
            const sessionOwner = this.transport.getDescriptor(this.transportPath)?.sessionOwner;

            return {
                ...base,
                type: 'unacquired',
                label: 'Unacquired device',
                name: this.name,
                transportSessionOwner: this.sessionAcquired ? undefined : sessionOwner,
                bluetoothProps: this.bluetoothProps,
                thp: this.thp?.serialize(),
            };
        }
        const defaultLabel = 'My Trezor';
        const label =
            this.features.label === '' || !this.features.label ? defaultLabel : this.features.label;
        const status: DeviceStatus = this.isUsedElsewhere()
            ? 'occupied'
            : (this.wasUsedElsewhere && 'used') || 'available';

        return {
            ...base,
            type: 'acquired',
            id: this.features.device_id,
            label,
            _state: this.getState(),
            state: this.getState()?.staticSessionId,
            status,
            mode: this.getMode(),
            color: this.color,
            firmware: this.firmwareStatus,
            firmwareRelease: this.firmwareRelease,
            firmwareType: this.firmwareType,
            features: this.features,
            unavailableCapabilities: this.unavailableCapabilities,
            availableTranslations: this.availableTranslations,
            authenticityChecks: this.authenticityChecks,
            bluetoothProps: this.bluetoothProps,
            thp: this.thp?.serialize(),
        };
    }
}
