import { storage } from '@trezor/connect-common';
import { Deferred, versionUtils } from '@trezor/utils';
import { DataManager } from '../data/DataManager';
import { ERRORS, NETWORK } from '../constants';
import {
    UI,
    DEVICE,
    createUiMessage,
    createDeviceMessage,
    CallMethodPayload,
    CallMethodResponse,
    UiRequestButtonData,
    UiPromiseCreator,
    PostMessage,
} from '../events';
import { getHost } from '../utils/urlUtils';
import type { Device } from '../device/Device';
import type { FirmwareRange } from '../types';

export type Payload<M> = Extract<CallMethodPayload, { method: M }> & { override?: boolean };
export type MethodReturnType<M extends CallMethodPayload['method']> = CallMethodResponse<M>;

export const DEFAULT_FIRMWARE_RANGE: FirmwareRange = {
    T1B1: { min: '1.0.0', max: '0' },
    T2T1: { min: '2.0.0', max: '0' },
    T2B1: { min: '2.6.1', max: '0' },
};

export abstract class AbstractMethod<Name extends CallMethodPayload['method'], Params = undefined> {
    responseID: number;

    // @ts-expect-error: strictPropertyInitialization
    device: Device;
    // @ts-expect-error: strictPropertyInitialization
    params: Params;

    devicePath?: string;

    deviceState?: string;

    hasExpectedDeviceState: boolean;

    keepSession: boolean;

    skipFinalReload: boolean;

    skipFirmwareCheck: boolean;

    overridePreviousCall: boolean;

    overridden: boolean;

    name: Name; // method name

    payload: Payload<Name>; // method payload

    get info() {
        return '';
    } // method info, displayed in popup info-panel

    useUi: boolean; // should use popup?

    useDevice: boolean; // use device

    useDeviceState: boolean; // should validate device state?

    preauthorized?: boolean; // another variant of device state validation

    useEmptyPassphrase: boolean;

    allowSeedlessDevice: boolean;

    firmwareRange: FirmwareRange;

    requiredPermissions: string[];

    allowDeviceMode: string[]; // used in device management (like ResetDevice allow !UI.INITIALIZED)

    requireDeviceMode: string[];

    network: NETWORK.NetworkType;

    useCardanoDerivation: boolean;

    confirmation?(): Promise<boolean | undefined>;

    noBackupConfirmation?(allowSuppression?: boolean): Promise<boolean>;

    getButtonRequestData?(code: string): UiRequestButtonData | undefined;

    // callbacks
    // @ts-expect-error: strictPropertyInitialization
    postMessage: PostMessage;
    // @ts-expect-error: strictPropertyInitialization
    getPopupPromise: () => Deferred<void>;
    // @ts-expect-error: strictPropertyInitialization
    createUiPromise: UiPromiseCreator;
    // @ts-expect-error: strictPropertyInitialization
    removeUiPromise: (promise: Deferred<any>) => void;

    initAsync?(): Promise<void>;
    initAsyncPromise?: Promise<void>;

    constructor(message: { id?: number; payload: Payload<Name> }) {
        const { payload } = message;
        this.name = payload.method;
        this.payload = payload;
        this.responseID = message.id || 0;
        this.devicePath = payload.device?.path;
        // expected state from method parameter.
        // it could be null
        this.deviceState = payload.device?.state;
        this.hasExpectedDeviceState = payload.device
            ? Object.prototype.hasOwnProperty.call(payload.device, 'state')
            : false;
        this.keepSession = typeof payload.keepSession === 'boolean' ? payload.keepSession : false;
        this.skipFinalReload =
            typeof payload.skipFinalReload === 'boolean' ? payload.skipFinalReload : false;
        this.skipFirmwareCheck = false;
        this.overridePreviousCall =
            typeof payload.override === 'boolean' ? payload.override : false;
        this.overridden = false;
        this.useEmptyPassphrase =
            typeof payload.useEmptyPassphrase === 'boolean' ? payload.useEmptyPassphrase : false;
        this.allowSeedlessDevice =
            typeof payload.allowSeedlessDevice === 'boolean' ? payload.allowSeedlessDevice : false;
        this.allowDeviceMode = [];
        this.requireDeviceMode = [];
        if (this.allowSeedlessDevice) {
            this.allowDeviceMode = [UI.SEEDLESS];
        }
        // Determine the type based on the method name
        this.network = 'bitcoin';
        (Object.keys(NETWORK.TYPES) as NETWORK.NetworkType[]).forEach(key => {
            if (this.name.startsWith(key)) {
                this.network = key;
            }
        });
        // default values for all methods
        this.firmwareRange = DEFAULT_FIRMWARE_RANGE;
        this.requiredPermissions = [];
        this.useDevice = true;
        this.useDeviceState = true;
        this.useUi = true;
        // should derive cardano seed? respect provided option or fall back to do it only when cardano method is called
        this.useCardanoDerivation =
            typeof payload.useCardanoDerivation === 'boolean'
                ? payload.useCardanoDerivation
                : payload.method.startsWith('cardano');
    }

    setDevice(device: Device) {
        this.device = device;
        this.devicePath = device.getDevicePath();
        // NOTE: every method should always send "device" parameter
        const originalFn = this.createUiPromise;
        this.createUiPromise = (t, d) => originalFn(t, d || device);
    }

    async requestPermissions() {
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_PERMISSION);
        this.postMessage(
            createUiMessage(UI.REQUEST_PERMISSION, {
                permissions: this.requiredPermissions,
                device: this.device.toMessageObject(),
            }),
        );
        // wait for response
        const uiResp = await uiPromise.promise;
        const { granted, remember } = uiResp.payload;
        if (granted) {
            this.savePermissions(!remember);
            return true;
        }
        return false;
    }

    private getOriginPermissions() {
        const origin = DataManager.getSettings('origin');
        if (!origin) {
            throw new Error('origin is not set');
        }

        return storage.loadForOrigin(origin)?.permissions || [];
    }

    checkPermissions() {
        const originPermissions = this.getOriginPermissions();
        let notPermitted = [...this.requiredPermissions];
        if (originPermissions.length > 0) {
            // check if permission was granted
            notPermitted = notPermitted.filter(np => {
                const granted = originPermissions.find(
                    p => p.type === np && p.device === this.device.features.device_id,
                );
                return !granted;
            });
        }
        this.requiredPermissions = notPermitted;
    }

    savePermissions(temporary = false) {
        const originPermissions = this.getOriginPermissions();

        let permissionsToSave = this.requiredPermissions.map(p => ({
            type: p,
            device: this.device.features.device_id || undefined,
        }));

        // check if this will be first time granted permission to read this device
        // if so, emit "device_connect" event because this wasn't send before
        let emitEvent = false;
        if (this.requiredPermissions.indexOf('read') >= 0) {
            const wasAlreadyGranted = originPermissions.filter(
                p => p.type === 'read' && p.device === this.device.features.device_id,
            );
            if (wasAlreadyGranted.length < 1) {
                emitEvent = true;
            }
        }

        if (originPermissions.length > 0) {
            permissionsToSave = permissionsToSave.filter(p2s => {
                const granted = originPermissions.find(
                    p => p.type === p2s.type && p.device === p2s.device,
                );
                return !granted;
            });
        }

        const origin = DataManager.getSettings('origin')!;
        storage.save(
            state => ({
                ...state,
                origin: {
                    ...state.origin,
                    [origin]: {
                        permissions: [
                            ...(state.origin[origin]?.permissions || []),
                            ...permissionsToSave,
                        ],
                    },
                },
            }),
            temporary,
        );

        if (emitEvent) {
            this.postMessage(createDeviceMessage(DEVICE.CONNECT, this.device.toMessageObject()));
        }
    }

    async checkFirmwareRange(isUsingPopup?: boolean) {
        if (this.skipFirmwareCheck) {
            return;
        }
        const { device } = this;

        // do not do fw range check for devices in BL mode as fw version of T1B1 in BL mode is not defined
        if (!device.features || device.isBootloader()) return;
        const range = this.firmwareRange[device.features.internal_model];

        if (device.firmwareStatus === 'none') {
            return UI.FIRMWARE_NOT_INSTALLED;
        }
        if (!range) {
            // range not known only for custom (unknown) models
            return;
        }
        if (range.min === '0') {
            return UI.FIRMWARE_NOT_SUPPORTED;
        }

        const version = device.getVersion().join('.');
        if (
            device.firmwareStatus === 'required' ||
            !versionUtils.isNewerOrEqual(version, range.min)
        ) {
            return UI.FIRMWARE_OLD;
        }

        if (range.max !== '0' && versionUtils.isNewer(version, range.max)) {
            if (isUsingPopup) {
                // wait for popup handshake
                await this.getPopupPromise().promise;
                // initialize user response promise
                const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);
                // show unexpected state information and wait for confirmation
                this.postMessage(
                    createUiMessage(UI.FIRMWARE_NOT_COMPATIBLE, device.toMessageObject()),
                );

                const uiResp = await uiPromise.promise;
                if (!uiResp.payload) {
                    throw ERRORS.TypedError('Method_PermissionsNotGranted');
                }
            } else {
                return UI.FIRMWARE_NOT_COMPATIBLE;
            }
        }
    }

    isManagementRestricted() {
        const { popup, origin } = DataManager.getSettings();
        if (popup && this.requiredPermissions.includes('management')) {
            const host = getHost(origin);
            const allowed = DataManager.getConfig().management.find(
                item => item.origin === host || item.origin === origin,
            );
            return !allowed;
        }
    }

    abstract init(): void;

    abstract run(): Promise<MethodReturnType<Name>>;

    dispose() {}
}
