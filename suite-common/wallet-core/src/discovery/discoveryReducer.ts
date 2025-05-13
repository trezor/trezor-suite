import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { Discovery, DiscoveryStatus } from '@suite-common/wallet-types';
import { DeviceUniquePath } from '@trezor/connect';

import { discoveryActions } from './discoveryActions';
import { DeviceRootState, selectSelectedDevice } from '../device/deviceReducer';

export type DiscoveryRootState = {
    wallet: {
        discovery: Discovery;
    };
};

const initialState: Discovery = {};

const update = (
    draft: Discovery,
    payload: { status: Omit<DiscoveryStatus, 'path'>; path: DeviceUniquePath },
) => {
    if (!draft[payload.path]) {
        return;
    }
    // todo: resolve expect error
    // @ts-expect-error
    draft[payload.path] = {
        ...draft[payload.path],
        ...payload.status,
    };
};

export const prepareDiscoveryReducer = createReducerWithExtraDeps(
    initialState,
    (builder, _extra) => {
        builder.addCase(discoveryActions.startDiscovery, (state, { payload }) => {
            state[payload.path] = {
                status: 'starting',
                isAddingHiddenWallet: payload.isAddingHiddenWallet,
                isAddingExistingWallet: payload.isAddingExistingWallet,
            };
        });
        builder.addCase(discoveryActions.updateDiscovery, (state, { payload }) => {
            update(state, payload);
        });

        builder.addCase(discoveryActions.deleteDiscovery, (state, { payload }) => {
            delete state[payload.path];
        });
    },
);

export const selectDiscovery = (state: DiscoveryRootState) => state.wallet.discovery;

// Get discovery process for deviceState.
export const selectDiscoveryByDevicePath = (state: DiscoveryRootState, path?: DeviceUniquePath) =>
    path ? state.wallet.discovery[path] : undefined;

export const selectDeviceDiscovery = (state: DiscoveryRootState & DeviceRootState) => {
    const selectedDevice = selectSelectedDevice(state);

    return selectDiscoveryByDevicePath(state, selectedDevice?.path);
};

export const selectIsDiscoveryActiveByDevicePath = (
    state: DiscoveryRootState & DeviceRootState,
    path?: DeviceUniquePath,
) => {
    const discovery = selectDiscoveryByDevicePath(state, path);

    if (!discovery) return false;

    return discovery.status === 'progress';
};

// todo: who knows if this is correct?
export const selectIsDeviceDiscoveryActive = (state: DiscoveryRootState & DeviceRootState) => {
    const selectedDevice = selectSelectedDevice(state);

    return selectIsDiscoveryActiveByDevicePath(state, selectedDevice?.path);
};

/**
 * Helper selector called from components
 * return `true` if discovery process is running/completed and `authConfirm` is required
 */
export const selectIsDiscoveryAuthConfirmationRequired = (
    state: DiscoveryRootState & DeviceRootState,
    path?: DeviceUniquePath,
) => selectDiscoveryByDevicePath(state, path)?.status === 'confirm-empty-passphrase';

export const selectHasDeviceDiscovery = (state: DiscoveryRootState & DeviceRootState) =>
    !!selectDeviceDiscovery(state);

export function isDiscoveryInProgress(
    discovery?: DiscoveryStatus,
): discovery is Exclude<
    DiscoveryStatus,
    { status: 'complete' } | { status: 'failed' } | { status: 'cancelled' }
> {
    if (!discovery) {
        return false;
    }
    return (
        discovery.status !== 'complete' &&
        discovery.status !== 'failed' &&
        discovery.status !== 'cancelled'
    );
}
