import { ERRORS, UI_EVENTS } from '@trezor/connect-common';
import type {
    CallMethodPayload,
    CallMethodResponse,
    CoinInfo,
    CoreEventMessage,
    DeviceButtonRequestCode,
    DeviceState,
    FirmwareCapability,
    StaticSessionId,
    UiRequestButtonData,
} from '@trezor/connect-common';
import { isStaticSessionId } from '@trezor/device-utils';
import type { Capability } from '@trezor/protobuf/src/definitions';
import { isNotUndefined, isUUID, versionUtils } from '@trezor/utils';

import { DEFAULT_FIRMWARE_RANGE, getFirmwareRange } from '../api/common/paramsValidator';
import * as enabledNetworksStore from '../data/enabledNetworksStore';
import type { Device } from '../device/Device';
import type { UiPromiseCreator } from '../events/ui-promise';
import { isDebugFirmware } from '../utils/firmwareUtils';

export { DEFAULT_FIRMWARE_RANGE };

export type Payload<M> = Extract<CallMethodPayload, { method: M }> & { override?: boolean };
export type MethodReturnType<M extends CallMethodPayload['method']> = CallMethodResponse<M>;

export type DeviceMode =
    | typeof UI_EVENTS.DEVICE_SEEDLESS
    | typeof UI_EVENTS.DEVICE_IN_BOOTLOADER
    | typeof UI_EVENTS.DEVICE_NOT_INITIALIZED;

export type MethodContext = {
    sendCoreMessage: (message: CoreEventMessage) => void;
    createUiPromise: UiPromiseCreator;
};

export type MethodMessage<Name extends CallMethodPayload['method']> = {
    id?: string;
    payload: Payload<Name>;
};

function validateStaticSessionId(input: unknown): StaticSessionId {
    if (!isStaticSessionId(input)) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'DeviceState: invalid staticSessionId: ' + input,
        );
    }

    return input;
}

function validateCallId(callId: unknown): string | undefined {
    if (callId === undefined) return undefined;

    if (!isUUID(callId)) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            `callId must be a valid UUID, got: ${callId}`,
        );
    }

    return callId;
}

// validate expected state from method parameter.
// it could be undefined
function validateDeviceState(device: CallMethodPayload['device']): DeviceState | undefined {
    if (!device || !('state' in device)) return {}; // no change in device state

    const input = device.state;

    if (typeof input === 'string') {
        return { staticSessionId: validateStaticSessionId(input) };
    }
    if (input && typeof input === 'object') {
        const state: DeviceState = {};
        if ('staticSessionId' in input) {
            state.staticSessionId = validateStaticSessionId(input.staticSessionId);
        }
        if ('sessionId' in input && typeof input.sessionId === 'string') {
            state.sessionId = input.sessionId;
        }
        if ('deriveCardano' in input && typeof input.deriveCardano === 'boolean') {
            state.deriveCardano = input.deriveCardano;
        }

        return state;
    }

    return undefined; // reset device state
}

export abstract class AbstractMethod<Name extends CallMethodPayload['method'], Params = undefined> {
    public responseID: string;

    public callId?: string;

    public device: Device | undefined;

    protected params: Params;

    public deviceState?: DeviceState;

    public keepSession: boolean;

    public skipFinalReload: boolean;

    public overridePreviousCall: boolean;

    public overridden: boolean;

    public readonly name: Name; // method name

    public useDevice: boolean; // use device

    public useDeviceState: boolean; // should validate device state?

    public preauthorized?: boolean; // another variant of device state validation

    public useEmptyPassphrase: boolean;

    public allowDeviceMode: DeviceMode[]; // used in device management (like ResetDevice allow !UI_EVENTS.DEVICE_NOT_INITIALIZED)

    protected requiredDeviceCapabilities: Capability[] = [];
    protected requiredFirmwareCapabilities: FirmwareCapability[] = [];
    protected requiredFirmwareCoins: (CoinInfo | undefined)[] = [];

    public useCardanoDerivation: boolean;

    public confirmMissingBackup: boolean;

    public getButtonRequestData?(
        code: DeviceButtonRequestCode,
        name?: string,
    ): UiRequestButtonData | undefined;

    constructor(message: MethodMessage<Name>, params: Params) {
        const { payload } = message;
        this.name = payload.method;
        this.params = params;
        this.responseID = message.id ?? '';
        this.callId = validateCallId(payload.callId);
        this.deviceState = validateDeviceState(payload.device);
        this.keepSession = typeof payload.keepSession === 'boolean' ? payload.keepSession : false;
        this.skipFinalReload = true;
        this.overridePreviousCall = false;
        this.overridden = false;
        this.useEmptyPassphrase =
            typeof payload.device?.useEmptyPassphrase === 'boolean'
                ? payload.device.useEmptyPassphrase
                : false;
        this.allowDeviceMode = [UI_EVENTS.DEVICE_SEEDLESS]; // Allow seedless by default

        // default values for all methods
        this.useDevice = true;
        this.useDeviceState = true;
        this.useCardanoDerivation = false;
        this.confirmMissingBackup = false;
    }

    // Resolves the Cardano session capability against the runtime enabled-networks set. MUST run on
    // the real device-call path (NOT the constructor): reflects any enablement applied before the
    // call (e.g. a permission grant projected into the store). Sets `useCardanoDerivation`
    // (→ `derive_cardano` at session create).
    public resolveCardanoCapability(): void {
        this.useCardanoDerivation =
            enabledNetworksStore.has('ada') || enabledNetworksStore.has('tada');
    }

    public setDevice(device: Device) {
        this.device = device;
    }

    public getDevice() {
        if (!this.device) {
            throw ERRORS.TypedError('Device_NotFound');
        }

        return this.device;
    }

    public checkFirmwareRange() {
        const device = this.getDevice();

        // do not do fw range check for devices in BL mode as fw version of T1B1 in BL mode is not defined
        if (!device.features || device.isBootloader()) return;

        // seedless devices do not offer firmware update - it is not desirable to update something that does not have seed
        if (device.isSeedless()) return;

        const firmwareRange = getFirmwareRange(
            [this.name, ...this.requiredFirmwareCapabilities],
            this.requiredFirmwareCoins.filter(isNotUndefined),
            DEFAULT_FIRMWARE_RANGE,
            isDebugFirmware(device.features),
        );
        const range = firmwareRange[device.features.internal_model];

        if (device.firmwareStatus === 'none') {
            return UI_EVENTS.FIRMWARE_NOT_INSTALLED;
        }
        if (!range) {
            // range not known only for custom (unknown) models
            return;
        }
        if (range.min === '0') {
            return UI_EVENTS.FIRMWARE_NOT_SUPPORTED;
        }

        const version = device.getVersion();
        if (!version) return;

        if (
            this.name !== 'backupDevice' &&
            this.name !== 'recoveryDevice' &&
            (device.firmwareStatus === 'required' ||
                !versionUtils.isNewerOrEqual(version, range.min))
        ) {
            return UI_EVENTS.FIRMWARE_OLD;
        }

        if (range.max !== '0' && versionUtils.isNewer(version, range.max)) {
            return UI_EVENTS.FIRMWARE_NOT_COMPATIBLE;
        }
    }

    public checkDeviceCapability() {
        const deviceHasAllRequiredCapabilities = (this.requiredDeviceCapabilities || []).every(
            capability => this.getDevice().features.capabilities.includes(capability),
        );
        if (!deviceHasAllRequiredCapabilities) {
            if (this.getDevice().firmwareType === 'bitcoin-only') {
                throw ERRORS.TypedError(
                    'Device_MissingCapabilityBtcOnly',
                    `Trezor has Bitcoin-only firmware installed, which does not support this operation. Please install Universal firmware through Trezor Suite.`,
                );
            }
            throw ERRORS.TypedError(
                'Device_MissingCapability',
                'Device does not have capability to call this method. Make sure you have the latest firmware installed.',
            );
        }
    }

    public abstract run(context: MethodContext): Promise<MethodReturnType<Name>>;

    public dispose() {}
}
