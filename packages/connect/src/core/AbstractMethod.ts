import { ERRORS, UI_REQUEST } from '@trezor/connect-common';
import type {
    CallMethodPayload,
    CallMethodResponse,
    CoinInfo,
    CoreEventMessage,
    DeviceState,
    PrecomposeResultFinal,
    StaticSessionId,
    UiRequestButtonData,
    UiRequestConfirmation,
} from '@trezor/connect-common';
import type { Capability } from '@trezor/protobuf/src/definitions';
import { isNotUndefined, versionUtils } from '@trezor/utils';

import { DEFAULT_FIRMWARE_RANGE, getFirmwareRange } from '../api/common/paramsValidator';
import type { Device } from '../device/Device';
import type { UiPromiseCreator } from '../events/ui-promise';

export { DEFAULT_FIRMWARE_RANGE };

export type Payload<M> = Extract<CallMethodPayload, { method: M }> & { override?: boolean };
export type MethodReturnType<M extends CallMethodPayload['method']> = CallMethodResponse<M>;

export type MethodPermission = 'read' | 'write' | 'management' | 'push_tx';
export type DeviceMode =
    | typeof UI_REQUEST.SEEDLESS
    | typeof UI_REQUEST.BOOTLOADER
    | typeof UI_REQUEST.INITIALIZE;

export type MethodInfo = {
    // static fields
    useUi: boolean;
    useDevice: boolean;
    useDeviceState: boolean;
    name: string;
    requiredPermissions: MethodPermission[];
    // available after init
    info: string;
    precomposed?: PrecomposeResultFinal;
    confirmation?: UiRequestConfirmation['payload'];
};

export type MethodContext = {
    sendCoreMessage: (message: CoreEventMessage) => void;
    createUiPromise: UiPromiseCreator;
};

export type MethodMessage<Name extends CallMethodPayload['method']> = {
    id?: number;
    payload: Payload<Name>;
};

function validateStaticSessionId(input: unknown): StaticSessionId {
    if (typeof input !== 'string')
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            'DeviceState: invalid staticSessionId: ' + input,
        );
    const [firstTestnetAddress, rest] = input.split('@');
    const [deviceId, instance] = rest.split(':');
    if (
        typeof firstTestnetAddress === 'string' &&
        typeof deviceId === 'string' &&
        typeof instance === 'string' &&
        Number.parseInt(instance) >= 0
    ) {
        return input as StaticSessionId;
    }
    throw ERRORS.TypedError(
        'Method_InvalidParameter',
        'DeviceState: invalid staticSessionId: ' + input,
    );
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
    public responseID: number;

    public device: Device | undefined;

    protected params: Params;

    public deviceState?: DeviceState;

    public keepSession: boolean;

    public skipFinalReload: boolean;

    public overridePreviousCall: boolean;

    public overridden: boolean;

    public readonly name: Name; // method name

    protected get info() {
        return '';
    } // method info, displayed in popup info-panel

    protected get confirmation(): UiRequestConfirmation['payload'] | undefined {
        return undefined;
    }

    public useUi: boolean; // should use popup?

    public useDevice: boolean; // use device

    public useDeviceState: boolean; // should validate device state?

    public preauthorized?: boolean; // another variant of device state validation

    public useEmptyPassphrase: boolean;

    abstract get requiredPermissions(): MethodPermission[];

    public allowDeviceMode: DeviceMode[]; // used in device management (like ResetDevice allow !UI_REQUEST.INITIALIZED)

    protected requiredDeviceCapabilities: Capability[] = [];
    protected requiredFirmwareCapabilities: string[] = [];
    protected requiredFirmwareCoins: (CoinInfo | undefined)[] = [];

    public useCardanoDerivation: boolean;

    public confirmMissingBackup: boolean;

    public getButtonRequestData?(code: string, name?: string): UiRequestButtonData | undefined;

    public initAsync?(): Promise<void>;

    constructor(message: MethodMessage<Name>, params: Params) {
        const { payload } = message;
        this.name = payload.method;
        this.params = params;
        this.responseID = message.id || 0;
        this.deviceState = validateDeviceState(payload.device);
        this.keepSession = typeof payload.keepSession === 'boolean' ? payload.keepSession : false;
        this.skipFinalReload = true;
        this.overridePreviousCall = false;
        this.overridden = false;
        this.useEmptyPassphrase =
            typeof payload.device?.useEmptyPassphrase === 'boolean'
                ? payload.device.useEmptyPassphrase
                : false;
        this.allowDeviceMode = [UI_REQUEST.SEEDLESS]; // Allow seedless by default

        // default values for all methods
        this.useDevice = true;
        this.useDeviceState = true;
        this.useUi = true;
        // should derive cardano seed? respect provided option or fall back to do it only when cardano method is called
        this.useCardanoDerivation =
            typeof payload.useCardanoDerivation === 'boolean'
                ? payload.useCardanoDerivation
                : payload.method.startsWith('cardano');
        this.confirmMissingBackup = false;
    }

    // Used in *getAddress methods
    protected getUseUi(
        params: { address?: string; proto: { show_display?: boolean } }[],
        useEventListener: boolean | undefined,
    ) {
        const notUseUi =
            useEventListener &&
            params.length === 1 &&
            typeof params[0].address === 'string' &&
            params[0].proto.show_display;

        return !notUseUi;
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
        );
        const range = firmwareRange[device.features.internal_model];

        if (device.firmwareStatus === 'none') {
            return UI_REQUEST.FIRMWARE_NOT_INSTALLED;
        }
        if (!range) {
            // range not known only for custom (unknown) models
            return;
        }
        if (range.min === '0') {
            return UI_REQUEST.FIRMWARE_NOT_SUPPORTED;
        }

        const version = device.getVersion();
        if (!version) return;

        if (
            this.name !== 'backupDevice' &&
            this.name !== 'recoveryDevice' &&
            (device.firmwareStatus === 'required' ||
                !versionUtils.isNewerOrEqual(version, range.min))
        ) {
            return UI_REQUEST.FIRMWARE_OLD;
        }

        if (range.max !== '0' && versionUtils.isNewer(version, range.max)) {
            return UI_REQUEST.FIRMWARE_NOT_COMPATIBLE;
        }
    }

    public getMethodInfo(): MethodInfo {
        return {
            useUi: this.useUi,
            useDevice: this.useDevice,
            useDeviceState: this.useDeviceState,
            name: this.name,
            requiredPermissions: this.requiredPermissions,
            info: this.info,
            precomposed: undefined, // requested by a special flag,
            confirmation: this.confirmation,
        };
    }

    public payloadToPrecomposed(): PrecomposeResultFinal | undefined {
        // Suite uses precomposed result for transaction review modals
        return undefined;
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
