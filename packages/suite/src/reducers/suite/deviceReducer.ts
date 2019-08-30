import produce from 'immer';
import { Device, DEVICE } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { getNewInstanceNumber, findInstanceIndex } from '@suite-utils/device';
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
    let { instanceLabel } = device;
    if (typeof upcoming.label === 'string' && upcoming.label !== device.label) {
        instanceLabel = upcoming.label;
        if (typeof device.instance === 'number') {
            instanceLabel += ` (${device.instanceName || device.instance})`;
        }
    }
    return {
        ...device,
        ...upcoming,
        state: device.state,
        instance: device.instance,
        instanceLabel,
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
            features: undefined,
            instance: undefined,
            useEmptyPassphrase: true,
            ts: new Date().getTime(),
        });
        return;
    }

    const { features } = device;
    // find affected devices with current "device_id" (acquired only)
    const affectedDevices = draft.filter(
        d => d.features && d.features.device_id === features.device_id,
    ) as AcquiredDevice[];
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
        useEmptyPassphrase: true,
        remember: false,
        connected: true,
        available: true,
        instance: undefined,
        instanceLabel: device.label,
        instanceName: undefined,
        ts: new Date().getTime(),
    };

    // update affected devices
    if (affectedDevices.length > 0) {
        // change availability according to "passphrase_protection" field
        let hasDifferentPassphraseSettings = false;
        let hasInstancesWithPassphraseSettings = false;
        const changedDevices = affectedDevices.map(d => {
            if (d.features.passphrase_protection === features.passphrase_protection) {
                hasInstancesWithPassphraseSettings = true;
                return merge(d, { ...device, connected: true, available: true });
            }
            hasDifferentPassphraseSettings = true;
            return merge(d, { ...d, connected: true, available: false });
        });

        // connected device with current "passphrase_protection" does not exists
        // automatically create new instance
        if (hasDifferentPassphraseSettings && !hasInstancesWithPassphraseSettings) {
            const instance = getNewInstanceNumber(affectedDevices, affectedDevices[0]);
            newDevice.instance = instance;
            newDevice.instanceLabel = `${device.label} (${instance})`;
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

    const { features } = device;
    // find devices with the same "device_id" and "passphrase_protection"
    const affectedDevices = draft.filter(
        d =>
            d.features &&
            ((d.features.device_id === features.device_id &&
                d.features.passphrase_protection === features.passphrase_protection) ||
                (d.path.length > 0 && d.path === device.path)),
    ) as AcquiredDevice[];

    const otherDevices = draft.filter(d => affectedDevices.indexOf(d as AcquiredDevice) === -1);
    // clear draft
    draft.splice(0, draft.length);
    // fill draft with not affected devices
    otherDevices.forEach(d => draft.push(d));

    if (affectedDevices.length > 0) {
        // merge incoming device with State
        const changedDevices = affectedDevices.map(d => merge(d, { ...device, ...extended }));
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
    // find all devices with "path" or "device_id"
    const affectedDevices = draft.filter(
        d =>
            d.path === device.path ||
            (d.features && device.features && d.features.device_id === device.features.device_id),
    );
    const otherDevices = draft.filter(d => affectedDevices.indexOf(d) === -1);

    if (affectedDevices.length > 0) {
        // remembered devices shouldn't be removed from reducer
        const rememberedDevices = affectedDevices.filter(
            d => d.features && d.remember,
        ) as AcquiredDevice[];
        // clear draft
        draft.splice(0, draft.length);
        // fill draft with not affected devices
        otherDevices.forEach(d => draft.push(d));
        // fill draft with affected but remembered devices
        rememberedDevices.forEach(d => {
            d.connected = false;
            d.available = false;
            d.status = 'available';
            d.path = '';
            draft.push(d);
        });
    }
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
    const index = findInstanceIndex(draft, device);
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
const changePassphraseMode = (draft: State, device: TrezorDevice, hidden: boolean) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = findInstanceIndex(draft, device);
    if (!draft[index]) return;
    // update fields
    draft[index].useEmptyPassphrase = !hidden;
    draft[index].state = undefined;
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
    const index = findInstanceIndex(draft, device);
    if (!draft[index]) return;
    // update state
    draft[index].state = state;
};

/**
 * Action handler: SUITE.CREATE_DEVICE_INSTANCE
 * @param {State} draft
 * @param {TrezorDevice} device
 * @returns
 */
const createInstance = (draft: State, device: TrezorDevice, name?: string) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = findInstanceIndex(draft, device);
    if (!draft[index]) return;

    const instance = getNewInstanceNumber(draft, device);
    const newDevice: TrezorDevice = {
        ...device,
        remember: false,
        state: undefined,
        // instance, (instance is already part of device - added in modal) TODO: it shoudnt
        instance,
        instanceLabel: `${device.label} (${name || instance})`,
        instanceName: name,
        ts: new Date().getTime(),
    };
    draft.push(newDevice);
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
    if (!device.features) return;
    const affectedDevices = draft.filter(
        d => d.features && d.features.device_id === device.features.device_id,
    );
    const otherDevices = draft.filter(d => affectedDevices.indexOf(d) === -1);
    // clear draft
    draft.splice(0, draft.length);
    // fill draft with not affected devices
    otherDevices.forEach(d => draft.push(d));
};

/**
 * Action handler: SUITE.FORGET_DEVICE_INSTANCE
 * Remove single device instance
 * @param {State} draft
 * @param {TrezorDevice} device
 */
const forgetInstance = (draft: State, device: TrezorDevice) => {
    // only acquired devices
    if (!device || !device.features) return;
    const index = findInstanceIndex(draft, device);
    if (!draft[index]) return;
    draft.splice(index, 1);
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
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
            case SUITE.RECEIVE_PASSPHRASE_MODE:
            case SUITE.UPDATE_PASSPHRASE_MODE:
                changePassphraseMode(draft, action.payload, action.hidden);
                break;
            case SUITE.AUTH_DEVICE:
                authDevice(draft, action.payload, action.state);
                break;
            case SUITE.CREATE_DEVICE_INSTANCE:
                createInstance(draft, action.payload, action.name);
                break;
            case SUITE.FORGET_DEVICE:
                forget(draft, action.payload);
                break;
            case SUITE.FORGET_DEVICE_INSTANCE:
                forgetInstance(draft, action.payload);
                break;
            // no default
        }
    });
};
