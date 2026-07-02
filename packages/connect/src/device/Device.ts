// original file https://github.com/trezor/connect/blob/develop/src/js/device/Device.js
import type {
    DeviceBusyStatus,
    DeviceFirmwareStatus,
    DeviceState,
    DeviceStatus,
    DeviceThpState,
    Device as DeviceTyped,
    DeviceUniquePath,
    Features,
    FirmwareHashCheckResult,
    FirmwareReleaseConfigInfo,
    FirmwareType,
    KnownDevice,
    PROTO,
    UnavailableCapabilities,
} from '@trezor/connect-common';
import { DEVICE, ERRORS, FIRMWARE, UI_REQUEST } from '@trezor/connect-common';
import type { CreateLogger } from '@trezor/connect-common/src/types/settings';
import type { FirmwareRelease } from '@trezor/device-utils';
import {
    DeviceModelInternal,
    getFirmwareOrBootloaderVersionArray,
    getFirmwareVersionArray,
    models,
} from '@trezor/device-utils';
import type { TransportProtocol } from '@trezor/protocol';
import { thp as protocolThp, v1 as protocolV1, v2 as protocolV2 } from '@trezor/protocol';
import {
    type Descriptor,
    type Session,
    TRANSPORT,
    TRANSPORT_ERROR,
    type Transport,
    type TransportDeviceEvent,
} from '@trezor/transport-common';
import type { Deferred, Logger } from '@trezor/utils';
import {
    TypedEmitter,
    cloneObject,
    createDeferred,
    deepEqual,
    isArrayMember,
    versionUtils,
} from '@trezor/utils';
import type { VersionArray } from '@trezor/utils/src/versionUtils';

import { DeviceCommands } from './DeviceCommands';
import type { TypedCallProvider } from './DeviceCurrentSession';
import { DeviceCurrentSession } from './DeviceCurrentSession';
import { checkFirmwareRevision } from './checkFirmwareRevision';
import { abortThpWorkflow, getThpChannel } from './thp';
import { getAllNetworks } from '../data/coinInfo';
import {
    getFirmwareReleaseConfigInfo,
    getFirmwareStatus,
    getReleaseByVersion,
} from '../data/firmwareInfo';
import * as settingsStore from '../data/settingsStore';
import type { DeviceEvents, DeviceLifecycleEvents, IDevice, RunOptions } from '../types/idevice';
import { getReleaseAsset } from '../utils/assetUtils';
import {
    ensureInternalModelFeature,
    getUnavailableCapabilities,
    parseCapabilities,
    parseRevision,
} from '../utils/deviceFeaturesUtils';
import {
    getFirmwareMode,
    getFirmwareType,
    isProductionFirmwareChannel,
} from '../utils/firmwareUtils';
import { changeLanguage } from './workflow/changeLanguage';
import { checkFirmwareHashWithRetries } from './workflow/checkFirmwareHashWithRetries';
import { handshakeCancel } from './workflow/handshake';

export { type DeviceEvents } from '../types/idevice';

type DeviceParams = {
    id: DeviceUniquePath;
    transport: Transport;
    descriptor: Descriptor;
    createLogger: CreateLogger;
};

export class Device extends TypedEmitter<DeviceEvents> implements IDevice {
    public readonly transport: Transport;
    private thp: protocolThp.ThpState | undefined;
    public readonly descriptor: Pick<Descriptor, 'apiType' | 'id' | 'type' | 'path' | 'model'>;
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

    private _currentRelease?: FirmwareRelease;
    public get currentRelease() {
        return this._currentRelease;
    }

    private _firmwareReleaseConfigInfo?: FirmwareReleaseConfigInfo;
    public get firmwareReleaseConfigInfo() {
        return this._firmwareReleaseConfigInfo;
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
    private busy?: DeviceBusyStatus;

    private _unavailableCapabilities: UnavailableCapabilities = {};
    public get unavailableCapabilities(): Readonly<UnavailableCapabilities> {
        return this._unavailableCapabilities;
    }

    private _firmwareType?: FirmwareType;
    public get firmwareType() {
        return this._firmwareType;
    }

    private get possibleHIDdevice() {
        return this.descriptor.type === 0 || this.descriptor.type === 2;
    }

    public get possibleT1() {
        return (this.descriptor.type ?? 0) <= 2;
    }

    private name = 'Trezor';

    private color?: string;

    private availableTranslations: Record<string, string> = {};

    private authenticityChecks: KnownDevice['authenticityChecks'] = {
        firmwareRevision: null,
        firmwareHash: null,
    };

    private readonly uniquePath;

    private readonly createLogger: CreateLogger;
    private readonly logger: Logger;

    readonly lifecycle = new TypedEmitter<DeviceLifecycleEvents>();

    // Last DEVICE.CHANGED payload emitted to clients; used to suppress redundant emits.
    private lastEmittedMessage?: DeviceTyped;

    private sessionDfd?: Deferred<Session | null>;

    constructor({ id, transport, descriptor, createLogger }: DeviceParams) {
        super();

        this._protocol = protocolV1;
        this.createLogger = createLogger;
        this.logger = createLogger('Device');

        // === immutable properties
        this.uniquePath = id;
        this.transport = transport;
        this.descriptor = {
            id: descriptor.id,
            apiType: descriptor.apiType,
            type: descriptor.type,
            path: descriptor.path,
            model: descriptor.model,
            // session, sessionOwner are handled separately
            // debug, debugSession are not relevant here
        };

        this.sessionAcquired = null;

        transport.on(TRANSPORT.STOPPED, this.onTransportStopped);
        transport.deviceEvents.on(this.descriptor.path, this.onTransportDeviceEvent);
    }

    get transportPath() {
        return this.descriptor.path;
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
                        error: { code: TRANSPORT_ERROR.SESSION_WRONG_PREVIOUS },
                    } as const;
                }
            } catch {
                return {
                    success: false,
                    error: { code: TRANSPORT_ERROR.DEVICE_DISCONNECTED_DURING_ACTION },
                } as const;
            }
        }

        return response;
    }

    acquire() {
        const sessionPromise = this.getSessionChangePromise();
        const previous = this.transport.getDescriptor(this.descriptor.path)?.session ?? null;

        this.acquirePromise = this.transport
            .acquire({ input: { path: this.descriptor.path, previous } })
            .then(result => this.waitAndCompareSession(result, sessionPromise))
            .then(result => {
                if (result.success) {
                    this.wasUsedElsewhere = false;
                    this.sessionAcquired = result.payload;
                    this.currentSession = new DeviceCurrentSession(
                        this,
                        this.transport,
                        this.sessionAcquired,
                        this.createLogger('DeviceCommands'),
                    );

                    return result;
                } else {
                    throw new Error(result.error.code);
                }
            })
            .finally(() => {
                this.acquirePromise = undefined;
            });

        return this.acquirePromise;
    }

    reset() {
        this.logger.info(`Resetting Features and ThpState`);
        // @ts-expect-error
        this._features = undefined;
        this._protocol = protocolV1;
        this.thp?.resetState();
        this.thp = undefined;
        // drop the dedup baseline so the next change is always emitted after a reset
        this.lastEmittedMessage = undefined;
    }

    setBusy(value?: DeviceBusyStatus) {
        this.busy = value;
    }

    release() {
        if (!this.sessionAcquired || this.keepTransportSession || this.releasePromise) {
            return;
        }

        const sessionPromise = this.getSessionChangePromise();

        this.releasePromise = this.transport
            .release({ session: this.sessionAcquired, path: this.descriptor.path })
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

    setupThp() {
        this.logger.info('Setup THP device');
        this._protocol = protocolV2;

        if (
            this.transport.name === 'BridgeTransport' &&
            !versionUtils.isNewerOrEqual(this.transport.version, '3.0.0')
        ) {
            // old bridge is not compatible with THP
            this.unreadableError = 'THP incompatible with bridge ' + this.transport.version;
        } else {
            try {
                this.thp = new protocolThp.ThpState();
            } catch (error) {
                // THP messages not loaded
                this.unreadableError = error.message;
            }
        }
    }

    // call only once, right after device creation
    async handshake() {
        if (this.isUsedElsewhere()) {
            return true;
        }

        try {
            await this.run();
        } catch (error) {
            this.logger.warn(`device.run error.message: ${error.message}, code: ${error.code}`);

            if (
                error.code === 'Device_NotFound' ||
                error.code === 'Device_Disconnected' ||
                error.message === TRANSPORT_ERROR.DEVICE_NOT_FOUND ||
                error.message === TRANSPORT_ERROR.DEVICE_DISCONNECTED_DURING_ACTION ||
                error.message === TRANSPORT_ERROR.HTTP_ERROR // bridge died during device initialization
            ) {
                // disconnected, do nothing
                return false;
            }

            if (
                // if unable to open device and it's HID -> device is unreadable
                (this.possibleHIDdevice &&
                    error.message === TRANSPORT_ERROR.INTERFACE_UNABLE_TO_OPEN_DEVICE) ||
                // catch LIBUSB_ERROR_ACCESS -> missing udev rules usually
                error.message === TRANSPORT_ERROR.LIBUSB_ERROR_ACCESS
            ) {
                this.unreadableError = error.message;
            }
        }

        return true;
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

        this.emitDeviceChanged();
    }

    // Emit DEVICE.CHANGED only when the client-visible device representation actually changed.
    // The transport reports a session change on every acquire/release, which would otherwise
    // surface as a redundant DEVICE.CHANGED (causing needless re-renders in clients such as
    // Suite) even though no client-visible state changed.
    // See https://github.com/trezor/trezor-suite/issues/6446.
    emitDeviceChanged() {
        const message = this.toMessageObject();
        if (this.lastEmittedMessage && deepEqual(this.lastEmittedMessage, message)) {
            return;
        }
        // Store an immutable snapshot: toMessageObject() embeds live references (e.g. features),
        // which can be mutated in place (e.g. setBusy), and would otherwise corrupt the baseline.
        this.lastEmittedMessage = cloneObject(message);
        this.lifecycle.emit(DEVICE.CHANGED);
    }

    startPiggybackAck() {
        this.logger.debug('start PiggybackAck');
        this.thp?.enablePiggybackAck(true);
    }

    async stopPiggybackAck() {
        if (this.currentSession && this.thp?.isPiggybackAckEnabled) {
            this.logger.debug('stop PiggybackAck');
            // send ThpAck for previously seen message
            await this.currentSession.send('ThpAck', {});
            this.thp?.enablePiggybackAck(false);
        }
    }

    // TODO empty fn variant can be split/removed
    run(fn?: () => Promise<void>, options: RunOptions = {}) {
        if (this.runPromise) {
            this.logger.warn('Previous call is still running');
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
                await this.stopPiggybackAck();
                await this.release();

                throw err;
            })
            .finally(() => {
                this.runAbort = undefined;
                this.runPromise = undefined;
            })
            .then(() => {
                if (wasUnacquired && !this.isUnacquired()) {
                    this.lifecycle.emit(DEVICE.CONNECT);
                }
            });

        return this.runPromise;
    }

    async interrupt(reason: Error) {
        await abortThpWorkflow(this);
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

        this.logger.debug('interruptionFromOutside');

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
                await handshakeCancel({ device: this, logger: this.logger, signal: abortSignal });

                if (this.protocol.name === 'v2') {
                    const withInteraction = !!fn;
                    this.busy = await getThpChannel(this, withInteraction);
                    this.updateNameAndColor();
                    if (!this.busy) {
                        await this.getFeatures();
                    }
                } else if (fn) {
                    await this.initialize(!!options.useCardanoDerivation);
                } else {
                    await this.getFeatures();
                }
            } catch (error) {
                this.logger.warn('Device._runInner error: ', error.message);

                if (error.code === 'Failure_Busy') {
                    this.busy = 'busy';
                }

                if (error.code === 'ThpDeviceLocked') {
                    this.busy = 'pin-locked';
                }

                if (
                    error.code === 'Device_ThpPairingTagInvalid' ||
                    error.code === 'Failure_ActionCancelled'
                ) {
                    // return as TypedError
                    return Promise.reject(error);
                }

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
            await checkFirmwareHashWithRetries({ device: this, logger: this.logger });
            await this.checkFirmwareRevisionWithRetries();
        }

        if (
            !options.skipLanguageChecks &&
            this.features?.language &&
            !this.features.language_version_matches &&
            this.atLeast('2.7.0')
        ) {
            this.logger.info('language version mismatch. silently updating...');

            try {
                await changeLanguage({ device: this, language: this.features.language });
            } catch (err) {
                this.logger.error('change language failed silently', err);
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
            await this.stopPiggybackAck();
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
        await this._updateCurrentRelease(message);
        this.setState({ deriveCardano: payload?.derive_cardano });
    }

    async getFeatures() {
        const { message } = await this.getCurrentSession().typedCall('GetFeatures', 'Features', {});
        this._updateFeatures(message);
        await this._updateCurrentRelease(message);
    }

    getAuthenticityChecks() {
        return this.authenticityChecks;
    }

    setAuthenticityChecks(firmwareHash: FirmwareHashCheckResult | null) {
        this.authenticityChecks.firmwareHash = firmwareHash;
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

        if (!firmwareVersion || !this.features || !this.firmwareType) {
            return; // This happens when device has no features (not yet connected)
        }

        if (this.features?.bootloader_mode === true) {
            return;
        }

        const release = getReleaseAsset(
            this.features.internal_model,
            firmwareVersion,
            this.firmwareType,
        );

        const result = await checkFirmwareRevision({
            internalModel: this.features.internal_model,
            firmwareVersion,
            deviceRevision: this.features.revision,
            expectedRevision: release?.firmware_revision,
            deviceBootloaderHash: this.features.bootloader_hash,
            expectedBootloaderHash: release?.bootloader_hash,
            firmwareType: this.firmwareType,
        });
        this.authenticityChecks = {
            ...this.authenticityChecks,
            firmwareRevision: result,
        };
    }

    private async _updateCurrentRelease(feat: Features) {
        const firmwareVersion = getFirmwareVersionArray({ features: feat });
        const newFirmwareType = getFirmwareType(feat);

        // We need firmwareVersion to lookup the release.
        if (!firmwareVersion) {
            return;
        }

        if (
            this._currentRelease &&
            newFirmwareType === this.firmwareType &&
            versionUtils.isEqual(this._currentRelease.version, firmwareVersion) &&
            // When test firmware channel is used, we need to fetch the release from remote.
            isProductionFirmwareChannel(settingsStore.get('firmwareChannel'))
        ) {
            return;
        }

        const release = await getReleaseByVersion(feat, firmwareVersion, newFirmwareType);
        this._currentRelease = release;
        this.availableTranslations = this._currentRelease?.translations ?? {};
    }

    private _updateFeatures(feat: Features) {
        const capabilities = parseCapabilities(feat);
        feat.capabilities = capabilities;
        // GetFeatures doesn't return 'session_id'
        if (this.features?.session_id && !feat.session_id) {
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
        const newVersion = getFirmwareOrBootloaderVersionArray(feat);
        this.deviceVersionCheck(feat);

        // check if FW version or capabilities did change
        if (!version || !versionUtils.isEqual(version, newVersion)) {
            this._unavailableCapabilities = getUnavailableCapabilities(feat, getAllNetworks());
            this._firmwareStatus = getFirmwareStatus(feat, getFirmwareType(feat));
            this._firmwareReleaseConfigInfo = getFirmwareReleaseConfigInfo(
                feat,
                getFirmwareType(feat),
            );
            // Bundled release JSONs are production assets, so only seed `currentRelease`
            // from them on production-like channels. On other channels the
            // channel-appropriate release is fetched from remote immediately after,
            // by the awaited `_updateCurrentRelease`.
            if (isProductionFirmwareChannel(settingsStore.get('firmwareChannel'))) {
                this._currentRelease = getReleaseAsset(
                    feat.internal_model,
                    newVersion,
                    getFirmwareType(feat),
                );
                this.availableTranslations = this._currentRelease?.translations ?? {};
            }
        }

        this._features = feat;

        this._firmwareType = getFirmwareType(feat);

        this.updateNameAndColor();

        this.busy = undefined;
    }

    // Ensure that FW version is invariable except for firmware update
    private deviceVersionCheck(feat: Features) {
        const version = this.getVersion();
        const oldId = this.features?.device_id;
        // unacquired, bootloader, or nothing otherwise nothing compare
        if (!oldId || !!feat.bootloader_mode || !version) return;

        const newVersion = getFirmwareOrBootloaderVersionArray(feat); // guaranteed to be FW mode here
        // This should never happen, it's indicative of a transport-level bug, so log to Sentry via console.error
        if (feat.device_id !== oldId) {
            // during wipe device, the same device (same path) changes id. This also ignores rare transport-level errors of mismatched response
            if (feat.initialized === this.features?.initialized) {
                // This is logged to Sentry via captureConsoleIntegration, so confidential fields
                // (device id, label, session id) must be stripped first. The mismatch itself plus the
                // firmware/model info left in features is enough to diagnose the transport-level bug.
                const stripConfidential = (f: Features) => ({
                    ...f,
                    device_id: undefined,
                    session_id: undefined,
                    label: undefined,
                });
                // this.features is overwritten with feat right after this method returns, so capture
                // the old features reference synchronously; it is redacted at the log site below.
                const oldFeatures = this.features;
                const { uniquePath: path } = this;
                // transport descriptors are useful debug info, but no need to await, the side-effect to log to Sentry can run async
                this.transport.enumerate().then(res => {
                    const descriptors = res.success ? res.payload : undefined;
                    console.error('getFeatures device id mismatch', {
                        path,
                        oldFeatures: oldFeatures && stripConfidential(oldFeatures),
                        newFeatures: stripConfidential(feat),
                        descriptors,
                    });
                });
            }

            return;
        }
        if (!versionUtils.isEqual(version, newVersion)) {
            this.emit(DEVICE.FIRMWARE_VERSION_CHANGED, {
                oldVersion: version,
                newVersion,
                device: this.toMessageObject(),
            });
        }
    }

    private updateNameAndColor() {
        const { internal_model, model_variant } = this.thp?.properties ?? {};
        const internalModel = this._features?.internal_model ?? internal_model;
        const unitColor = this._features?.unit_color ?? (model_variant ?? 0) % 256;

        const deviceInfo = models[internalModel] ?? {
            name: `Unknown ${internalModel}`,
            colors: {},
        };

        this.name = deviceInfo.name;

        if (unitColor) {
            const deviceUnitColor = unitColor.toString();
            if (deviceUnitColor in deviceInfo.colors) {
                this.color = deviceInfo.colors[deviceUnitColor];
            }
        }
    }

    // For now only battery level is allowed to be updated from outside
    updateFeature<K extends keyof Pick<Features, 'soc'>>(key: K, value: Features[K]) {
        if (this._features) {
            this._features = {
                ...this._features,
                [key]: value,
            };
            this.emitDeviceChanged();
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

    private disconnect() {
        this.logger.debug('Disconnect cleanup');

        this.transport.off(TRANSPORT.STOPPED, this.onTransportStopped);
        this.transport.deviceEvents.off(this.descriptor.path, this.onTransportDeviceEvent);
        this.removeAllListeners();

        this.sessionDfd?.reject(new Error());

        if (this.sessionAcquired) {
            this.transport.releaseSync(this.sessionAcquired);
            this.sessionAcquired = null; // set to null to prevent transport.release and cancelableAction
        }

        this.lifecycle.emit(DEVICE.DISCONNECT);

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
        return this.features ? getFirmwareOrBootloaderVersionArray(this.features) : undefined;
    }

    atLeast(versions: string[] | string) {
        const version = this.getVersion();
        if (!this.features || !version) return false;
        if (typeof versions === 'string') {
            return versionUtils.isNewerOrEqual(version, versions);
        }
        const modelVersionIndex = this.features.major_version - 1;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const modelVersion: string = versions[modelVersionIndex];

        return versionUtils.isNewerOrEqual(version, modelVersion);
    }

    isUsed() {
        return !!this.transport.getDescriptor(this.descriptor.path)?.session;
    }

    isUsedHere() {
        return !!this.sessionAcquired;
    }

    getBusy() {
        return this.busy;
    }

    isUsedElsewhere() {
        return this.isUsed() && !this.isUsedHere();
    }

    getUniquePath() {
        return this.uniquePath;
    }

    hasUnexpectedMode(allow: string[]) {
        // both allow and require cases might generate single unexpected mode
        if (this.features) {
            // allow cases
            if (this.isBootloader() && !allow.includes(UI_REQUEST.BOOTLOADER)) {
                return UI_REQUEST.BOOTLOADER;
            }
            if (!this.isInitialized() && !allow.includes(UI_REQUEST.INITIALIZE)) {
                return UI_REQUEST.INITIALIZE;
            }
            if (this.isSeedless() && !allow.includes(UI_REQUEST.SEEDLESS)) {
                return UI_REQUEST.SEEDLESS;
            }
        }

        return null;
    }

    private getStatus(): DeviceStatus {
        if (this.isUsedElsewhere()) return 'occupied';
        if (this.wasUsedElsewhere) return 'used';
        if (this.busy) return this.busy;

        return 'available';
    }

    private getDeviceThp(): DeviceThpState | undefined {
        const state = this.thp?.serialize();

        return state
            ? {
                  properties: state.properties,
                  credentials: state.credentials,
                  channel: state.channel,
              }
            : undefined;
    }

    // simplified object to pass via postMessage
    toMessageObject(): DeviceTyped {
        const { name, uniquePath: path, descriptor } = this;
        const { apiType, id } = descriptor;
        const base = { path, name, descriptor: { apiType, id } };

        if (this.unreadableError) {
            return {
                ...base,
                type: 'unreadable',
                error: this.unreadableError, // provide error details
                label: 'Unreadable device',
                hid: this.possibleHIDdevice,
            };
        }
        if (this.isUnacquired()) {
            const sessionOwner = this.transport.getDescriptor(this.descriptor.path)?.sessionOwner;

            return {
                ...base,
                type: 'unacquired',
                label: 'Unacquired device',
                name: this.name,
                transportSessionOwner: this.sessionAcquired ? undefined : sessionOwner,
                thp: this.getDeviceThp(),
                status: this.busy ? this.busy : undefined,
            };
        }
        const defaultLabel = 'My Trezor';
        const label =
            this.features.label === '' || !this.features.label ? defaultLabel : this.features.label;

        return {
            ...base,
            type: 'acquired',
            id: this.features.device_id,
            label,
            state: this.getState(),
            status: this.getStatus(),
            mode: getFirmwareMode(this.features),
            color: this.color,
            firmware: this.firmwareStatus,
            firmwareReleaseConfigInfo: this.firmwareReleaseConfigInfo,
            firmwareType: this.firmwareType,
            features: this.features,
            unavailableCapabilities: this.unavailableCapabilities,
            availableTranslations: this.availableTranslations,
            authenticityChecks: this.authenticityChecks,
            thp: this.getDeviceThp(),
        };
    }
}
