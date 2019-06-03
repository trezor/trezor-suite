import { DEVICE } from 'trezor-connect';

import { TrezorDevice, Action } from '@suite/types';

type Device = any;

export type State = TrezorDevice[];

const initialState: State = [];

const mergeDevices = (current: TrezorDevice, upcoming: Device | TrezorDevice): TrezorDevice => {
    // do not merge if passphrase protection was changed
    // if (upcoming.features && current.features) {
    //     if (upcoming.features.passphrase_protection !== current.features.passphrase_protection) {
    //         // device settings has been changed, reset state
    //         // dev.state = null;
    //     }
    // }

    let { instanceLabel } = current;
    if (upcoming.label !== current.label) {
        instanceLabel = upcoming.label;
        if (typeof current.instance === 'number') {
            instanceLabel += ` (${current.instanceName || current.instance})`;
        }
    }

    const extended = {
        connected: typeof upcoming.connected === 'boolean' ? upcoming.connected : current.connected,
        available: typeof upcoming.available === 'boolean' ? upcoming.available : current.available,
        remember: typeof upcoming.remember === 'boolean' ? upcoming.remember : current.remember,
        instance: current.instance,
        instanceLabel,
        instanceName:
            typeof upcoming.instanceName === 'string'
                ? upcoming.instanceName
                : current.instanceName,
        state: current.state,
        ts: typeof upcoming.ts === 'number' ? upcoming.ts : current.ts,
        useEmptyPassphrase:
            typeof upcoming.useEmptyPassphrase === 'boolean'
                ? upcoming.useEmptyPassphrase
                : current.useEmptyPassphrase,
    };

    if (upcoming.type === 'acquired') {
        return { ...upcoming, ...extended };
    }
    if (upcoming.type === 'unacquired' && current.features && current.state) {
        // corner-case: trying to merge unacquired device with acquired
        // make sure that sensitive fields will not be changed and device will remain acquired
        return {
            type: 'acquired',
            path: upcoming.path,
            ...current,
            ...extended,
        };
    }
    return {
        ...upcoming,
        features: null,
        ...extended,
    };
};

const addDevice = (state: State, device: Device): State => {
    let affectedDevices: TrezorDevice[] = [];
    let otherDevices: TrezorDevice[] = [];
    if (!device.features) {
        // if connected device is unacquired
        // and if this device already exists in reducer
        // ignore this action
        affectedDevices = state.filter(d => d.path === device.path);
        if (affectedDevices.length > 0) {
            return state;
        }
        otherDevices = state.filter(d => affectedDevices.indexOf(d) === -1);
    } else {
        // find devices with this device_id
        affectedDevices = state.filter(
            d =>
                d.features && device.features && d.features.device_id === device.features.device_id,
        );
        // find unacquired device with this device_id (unacquired device become acquired)
        const unacquiredDevices = state.filter(d => d.path.length > 0 && d.path === device.path);
        otherDevices = state.filter(
            d => affectedDevices.indexOf(d) < 0 && unacquiredDevices.indexOf(d) < 0,
        );
    }

    // extend trezor-connect object
    const extended = {
        remember: false,
        connected: true,
        available: true,
        path: device.path,
        label: device.label,
        state: null,
        instanceLabel: device.label,
        instanceName: null,
        ts: new Date().getTime(),
        useEmptyPassphrase: true,
    };

    // create new device
    const newDevice: TrezorDevice =
        device.type === 'acquired'
            ? {
                  ...device,
                  ...extended,
              }
            : {
                  ...device,
                  features: null,
                  ...extended,
              };

    if (affectedDevices.length > 0) {
        const changedDevices = affectedDevices
            .filter(
                d =>
                    d.features &&
                    device.features &&
                    d.features.passphrase_protection === device.features.passphrase_protection,
            )
            .map(d => {
                const extended2: Record<string, any> = { connected: true, available: true };
                return mergeDevices(d, { ...device, ...extended2 });
            });
        if (changedDevices.length !== affectedDevices.length) {
            changedDevices.push(newDevice);
        }

        return otherDevices.concat(changedDevices);
    }
    return otherDevices.concat([newDevice]);
};

const changeDevice = (
    state: State,
    device: Device | TrezorDevice,
    extended: Record<string, any>,
): State => {
    // change only acquired devices
    if (!device.features) return state;

    // find devices with the same device_id and passphrase_protection settings
    // or devices with the same path (TODO: should be that way?)
    const affectedDevices: TrezorDevice[] = state.filter(
        d =>
            (d.features &&
                device.features &&
                d.features.device_id === device.features.device_id &&
                d.features.passphrase_protection === device.features.passphrase_protection) ||
            (d.features && d.path.length > 0 && d.path === device.path),
    );

    const otherDevices: TrezorDevice[] = state.filter(d => affectedDevices.indexOf(d) === -1);

    if (affectedDevices.length > 0) {
        // merge incoming device with State
        const changedDevices = affectedDevices.map(d =>
            mergeDevices(d, { ...device, ...extended }),
        );
        return otherDevices.concat(changedDevices);
    }

    return state;
};

const disconnectDevice = (state: State, device: Device): State => {
    const affectedDevices: State = state.filter(
        d =>
            d.path === device.path ||
            (d.features && device.features && d.features.device_id === device.features.device_id),
    );
    const otherDevices: State = state.filter(d => affectedDevices.indexOf(d) === -1);

    if (affectedDevices.length > 0) {
        const acquiredDevices = affectedDevices
            .filter(d => d.features && d.state)
            .map(d => {
                // eslint-disable-line arrow-body-style
                return d.type === 'acquired'
                    ? {
                          ...d,
                          connected: false,
                          available: false,
                          status: 'available',
                          path: '',
                      }
                    : d;
            });
        return otherDevices.concat(acquiredDevices);
    }

    return state;
};

export default function devices(state: State = initialState, action: Action): State {
    switch (action.type) {
        // case CONNECT.AUTH_DEVICE:
        //     return authDevice(state, action.device, action.state);

        // case CONNECT.REMEMBER:
        //     // return changeDevice(state, { ...action.device, path: '', remember: true });
        //     return changeDevice(state, action.device, { path: '', remember: true });

        // case CONNECT.FORGET:
        //     return forgetDevice(state, action.device);
        // case CONNECT.FORGET_SINGLE:
        // case CONNECT.FORGET_SILENT:
        //     return forgetSingleDevice(state, action.device);

        case DEVICE.CONNECT:
        case DEVICE.CONNECT_UNACQUIRED:
            return addDevice(state, action.payload);

        case DEVICE.CHANGED:
            // return changeDevice(state, { ...action.device, connected: true, available: true });
            return changeDevice(state, action.payload, { connected: true, available: true });
        // TODO: check if available will propagate to unavailable

        case DEVICE.DISCONNECT:
            // case DEVICE.DISCONNECT_UNACQUIRED:
            return disconnectDevice(state, action.payload);

        // case WALLET.SET_SELECTED_DEVICE:
        //     return onSelectedDevice(state, action.device);

        // case CONNECT.RECEIVE_WALLET_TYPE:
        // case CONNECT.UPDATE_WALLET_TYPE:
        //     return onChangeWalletType(state, action.device, action.hidden);

        default:
            return state;
    }
}
