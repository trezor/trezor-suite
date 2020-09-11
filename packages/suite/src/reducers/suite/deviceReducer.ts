import produce from 'immer';
import { Device, DEVICE } from 'trezor-connect';
import { SUITE, STORAGE, METADATA } from '@suite-actions/constants';
import * as deviceUtils from '@suite-utils/device';
import { TrezorDevice, AcquiredDevice, Action } from '@suite-types';

type State = TrezorDevice[];
const initialState: State = [];

/**
 * Local utility: set updated fields for device
 * @param {AcquiredDevice} device
 * @param {Partial<AcquiredDevice>} upcoming
 * @returns {TrezorDevice}
 */
const merge = (device: AcquiredDevice, upcoming: Partial<AcquiredDevice>): TrezorDevice => {
    return {
        ...device,
        ...upcoming,
        state: device.state,
        instance: device.instance,
    };
};

/**
 * Action handler: DEVICE.CONNECT + DEVICE.CONNECT_UNACQUIRED
 * @param {State} draft
 * @param {Device} device
 * @returns
 */
const connectDevice = (draft: State, device: Device) => {
    // connected device is unacquired/unreadable
    if (!device.features) {
        // check if device already exists in reducer
        const unacquiredDevices = draft.filter(d => d.path === device.path);
        if (unacquiredDevices.length > 0) {
            // and ignore this action if so
            return;
        }
        draft.push({
            ...device,
            connected: true,
            available: false,
            useEmptyPassphrase: true,
            buttonRequests: [],
            metadata: { status: 'disabled' },
            ts: new Date().getTime(),
        });
        return;
    }

    const { features } = device;
    // older FW (< 2.3.2) doesn't have `unlocked` field in Features ALSO doesn't have auto-lock, so it's always true
    const unlocked = typeof features.unlocked === 'boolean' ? features.unlocked : true;
    // find affected devices with current "device_id" (acquired only)
    const affectedDevices = draft.filter(d => d.features && d.id === device.id) as AcquiredDevice[];
    // find unacquired device with current "path" (unacquired device will become acquired)
    const unacquiredDevices = draft.filter(d => d.path.length > 0 && d.path === device.path);
    // get not affected devices
    // and exclude unacquired devices with current "device_id" (they will become acquired)
    const otherDevices: TrezorDevice[] = draft.filter(
        d => affectedDevices.indexOf(d as AcquiredDevice) < 0 && unacquiredDevices.indexOf(d) < 0,
    );

    // clear draft
    draft.splice(0, draft.length);
    // fill draft with not affected devices
    otherDevices.forEach(d => draft.push(d));

    // prepare new device
    const newDevice: TrezorDevice = {
        ...device,
        useEmptyPassphrase: unlocked && !features.passphrase_protection,
        remember: false,
        connected: true,
        available: true,
        authConfirm: false,
        instance: features.passphrase_protection
            ? deviceUtils.getNewInstanceNumber(draft, device) || 1
            : undefined,
        buttonRequests: [],
        metadata: { status: 'disabled' },
        ts: new Date().getTime(),
    };

    // update affected devices
    if (affectedDevices.length > 0) {
        const changedDevices = affectedDevices.map(d => {
            // change availability according to "passphrase_protection" field
            if (d.instance && unlocked && !features.passphrase_protection) {
                return merge(d, { ...device, connected: true, available: false });
            }
            return merge(d, { ...device, connected: true, available: true });
        });

        // affected device with current "passphrase_protection" does not exists
        // basically it means that the "base" device without "instance" was forgotten (removed from reducer)
        // automatically create new instance
        if (!changedDevices.find(d => d.available)) {
            changedDevices.push(newDevice);
        }
        // fill draft with affectedDevices values
        changedDevices.forEach(d => draft.push(d));
    } else {
        // add new device
        draft.push(newDevice);
    }
};

/**
 * Action handler: DEVICE.CHANGED
 * @param {State} draft
 * @param {(Device | TrezorDevice)} device
 * @param {Partial<AcquiredDevice>} [extended]
 * @returns
 */
const changeDevice = (
    draft: State,
    device: Device | TrezorDevice,
    extended?: Partial<AcquiredDevice>,
) => {
    // change only acquired devices
    if (!device.features) return;

    // find devices with the same "device_id"
    const affectedDevices = draft.filter(
        d =>
            d.features &&
            d.connected &&
            (d.id === device.id || (d.path.length > 0 && d.path === device.path)),
    ) as AcquiredDevice[];

    const otherDevices = draft.filter(d => affectedDevices.indexOf(d as AcquiredDevice) === -1);
    // clear draft
    draft.splice(0, draft.length);
    // fill draft with not affected devices
    otherDevices.forEach(d => draft.push(d));

    if (affectedDevices.length > 0) {
        // merge incoming device with State
        const changedDevices = affectedDevices.map(d => {
            // change availability according to "passphrase_protection" field
            // older FW (< 2.3.2) doesn't have `unlocked` field in Features ALSO doesn't have auto-lock, so it's always true
            const unlocked =
                typeof device.features.unlocked === 'boolean' ? device.features.unlocked : true;
            if (d.instance && unlocked && !device.features.passphrase_protection) {
                return merge(d, { ...device, ...extended, available: !d.state });
            }
            return merge(d, { ...device, ...extended, available: true });
        });
        // fill draft with affectedDevices values
        changedDevices.forEach(d => draft.push(d));
    }
};

/**
 * Action handler: DEVICE.DISCONNECT
 * @param {State} draft
 * @param {Device} device
 */
const disconnectDevice = (draft: State, device: Device) => {
    // find all devices with "path"
    const affectedDevices = draft.filter(d => d.path === device.path);
    affectedDevices.forEach(d => {
        // do not remove devices with state, they are potential candidates to remember if not remembered already
        const skip = d.features && d.remember;
        if (skip) {
            d.connected = false;
            d.available = false;
            d.path = '';
        } else {
            draft.splice(draft.indexOf(d), 1);
        }
    });

    // remove.forEach(d => {
    //     draft.splice(draft.indexOf(d), 1);
    // });

    // if (remove.length >)

    // if (affectedDevices.length > 0) {
    //     // remembered devices shouldn't be removed from reducer
    //     const rememberedDevices = affectedDevices.filter(
    //         d => d.features && d.remember,
    //     ) as AcquiredDevice[];
    //     // clear draft
    //     draft.splice(0, draft.length);
    //     // fill draft with not affected devices
    //     otherDevices.forEach(d => draft.push(d));
    //     // fill draft with affected but remembered devices
    //     rememberedDevices.forEach(d => {
    //         d.connected = false;
    //         d.available = false;
    //         d.status = 'available';
    //         d.path = '';
    //         draft.push(d);
    //     });
    // }
};

/**
 * Action handler: SUITE.SELECT_DEVICE
 * @param {State} draft
 * @param {TrezorDevice} [device]
 * @returns
 */
const updateTimestamp = (draft: State, device?: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft, device);
    if (!draft[index]) return;
    // update timestamp
    draft[index].ts = new Date().getTime();
};

/**
 * Action handler: SUITE.RECEIVE_PASSPHRASE_MODE + SUITE.UPDATE_PASSPHRASE_MODE
 * @param {State} draft
 * @param {TrezorDevice} device
 * @param {boolean} hidden
 * @returns
 */
const changePassphraseMode = (
    draft: State,
    device: TrezorDevice,
    hidden: boolean,
    alwaysOnDevice = false,
) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft, device);
    if (!draft[index]) return;
    // update fields
    draft[index].useEmptyPassphrase = !hidden;
    draft[index].passphraseOnDevice = alwaysOnDevice;
    // draft[index].instance = undefined;
    draft[index].ts = new Date().getTime();
};

/**
 * Action handler: SUITE.AUTH_DEVICE
 * @param {State} draft
 * @param {TrezorDevice} device
 * @param {string} state
 * @returns
 */
const authDevice = (draft: State, device: TrezorDevice, state: string) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft, device);
    if (!draft[index]) return;
    // update state
    draft[index].state = state;
    delete draft[index].authFailed;
};

/**
 * Action handler: SUITE.AUTH_FAILED
 * @param {State} draft
 * @param {TrezorDevice} device
 * @returns
 */
const authFailed = (draft: State, device: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft, device);
    if (!draft[index]) return;
    draft[index].authFailed = true;
};

/**
 * Action handler: SUITE.RECEIVE_AUTH_CONFIRM
 * @param {State} draft
 * @param {TrezorDevice} device
 * @param {boolean} success
 * @returns
 */
const authConfirm = (draft: State, device: TrezorDevice, success: boolean) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft, device);
    if (!draft[index]) return;
    // update state
    draft[index].authConfirm = !success;
    draft[index].available = success;
};

/**
 * Action handler: SUITE.CREATE_DEVICE_INSTANCE
 * @param {State} draft
 * @param {TrezorDevice} device
 * @returns
 */
const createInstance = (draft: State, device: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;
    const newDevice: TrezorDevice = {
        ...device,
        passphraseOnDevice: false,
        remember: false,
        state: undefined,
        authConfirm: false,
        ts: new Date().getTime(),
        buttonRequests: [],
        metadata: { status: 'disabled' },
    };
    draft.push(newDevice);
};

/**
 * Action handler: SUITE.REMEMBER_DEVICE
 * Set `remember` field for a single device instance
 * @param {State} draft
 * @param {TrezorDevice} device
 */
const remember = (draft: State, device: TrezorDevice, remember: boolean) => {
    // only acquired devices with state
    if (!device || !device.features || !device.state) return;
    draft.forEach(d => {
        if (deviceUtils.isSelectedInstance(device, d)) {
            d.remember = remember;
        }
    });
};

/**
 * Action handler: SUITE.FORGET_DEVICE
 * Remove all device instances
 * @param {State} draft
 * @param {TrezorDevice} device
 * @returns
 */
const forget = (draft: State, device: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft, device);
    if (!draft[index]) return;
    const others = deviceUtils.getDeviceInstances(device, draft, true);
    if (device.connected && others.length < 1) {
        // do not forget the last instance, just reset state
        draft[index].state = undefined;
        draft[index].useEmptyPassphrase = !device.features.passphrase_protection;
        draft[index].passphraseOnDevice = false;
        // set remember to false to make it disappear after device is disconnected
        draft[index].remember = false;
        draft[index].metadata = { status: 'disabled' };
    } else {
        draft.splice(index, 1);
    }
};

const addButtonRequest = (
    draft: State,
    device: TrezorDevice | undefined,
    buttonRequest?: string,
) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = deviceUtils.findInstanceIndex(draft, device);
    if (!draft[index]) return;
    // update state
    if (!buttonRequest) {
        draft[index].buttonRequests = [];
        return;
    }
    draft[index].buttonRequests.push(buttonRequest);
};

const setMetadata = (draft: State, state: string, metadata: TrezorDevice['metadata']) => {
    const index = draft.findIndex(d => d.state === state);
    if (!draft[index]) return;
    // update state
    draft[index].metadata = metadata;
};

const updateMetadata = (draft: State, state: string, walletLabel?: string) => {
    const index = draft.findIndex(d => d.state === state);
    if (!draft[index]) return;
    const { metadata } = draft[index];
    if (metadata.status !== 'enabled') return;
    // update state
    metadata.walletLabel = walletLabel;
};

const deviceReducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOADED:
                return action.payload.devices;
            case DEVICE.CONNECT:
            case DEVICE.CONNECT_UNACQUIRED:
                connectDevice(draft, action.payload);
                break;
            case DEVICE.CHANGED:
                changeDevice(draft, action.payload, { connected: true, available: true });
                break;
            case DEVICE.DISCONNECT:
                disconnectDevice(draft, action.payload);
                break;
            case SUITE.SELECT_DEVICE:
                updateTimestamp(draft, action.payload);
                break;
            case SUITE.UPDATE_PASSPHRASE_MODE:
                changePassphraseMode(draft, action.payload, action.hidden, action.alwaysOnDevice);
                break;
            case SUITE.AUTH_DEVICE:
                authDevice(draft, action.payload, action.state);
                break;
            case SUITE.AUTH_FAILED:
                authFailed(draft, action.payload);
                break;
            case SUITE.RECEIVE_AUTH_CONFIRM:
                authConfirm(draft, action.payload, action.success);
                break;
            case SUITE.CREATE_DEVICE_INSTANCE:
                createInstance(draft, action.payload);
                break;
            case SUITE.REMEMBER_DEVICE:
                remember(draft, action.payload, action.remember);
                break;
            case SUITE.FORGET_DEVICE:
                forget(draft, action.payload);
                break;
            case SUITE.ADD_BUTTON_REQUEST:
                addButtonRequest(draft, action.device, action.payload);
                break;
            case METADATA.SET_DEVICE_METADATA:
                setMetadata(draft, action.payload.deviceState, action.payload.metadata);
                break;
            case METADATA.WALLET_LOADED:
            case METADATA.WALLET_ADD:
                updateMetadata(draft, action.payload.deviceState, action.payload.walletLabel);
                break;
            // no default
        }
    });
};

export default deviceReducer;
