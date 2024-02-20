import { A, pipe } from '@mobily/ts-belt';

import { createDeferred } from '@trezor/utils';
import { Discovery, PartialDiscovery } from '@suite-common/wallet-types';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { DiscoveryStatus } from '@suite-common/wallet-constants';

import { discoveryActions } from './discoveryActions';
import {
    DeviceRootState,
    selectDevice,
    selectPersistedDeviceStates,
} from '../device/deviceReducer';

export type DiscoveryState = Discovery[];

export type DiscoveryRootState = {
    wallet: {
        discovery: DiscoveryState;
    };
};

const initialState: DiscoveryState = [];

const update = (draft: DiscoveryState, payload: PartialDiscovery, resolve?: boolean) => {
    const index = draft.findIndex(f => f.deviceState === payload.deviceState);
    if (index >= 0) {
        const dfd = draft[index].running;
        draft[index] = {
            ...draft[index],
            ...payload,
        };
        if (resolve && dfd) {
            dfd.resolve();
            delete draft[index].running;
        }
        if (!payload.error) {
            delete draft[index].error;
        }
    }
};

export const prepareDiscoveryReducer = createReducerWithExtraDeps(
    initialState,
    (builder, extra) => {
        builder
            .addCase(discoveryActions.createDiscovery, (state, { payload }) => {
                const index = state.findIndex(d => d.deviceState === payload.deviceState);
                if (index < 0) {
                    state.push(payload);
                }
            })
            .addCase(discoveryActions.startDiscovery, (state, { payload }) => {
                const index = state.findIndex(f => f.deviceState === payload.deviceState);
                if (index >= 0) {
                    state[index] = {
                        ...state[index],
                        ...payload,
                        running: createDeferred(),
                    };
                }
            })
            .addCase(discoveryActions.removeDiscovery, (state, { payload }) => {
                const index = state.findIndex(f => f.deviceState === payload);
                state.splice(index, 1);
            })
            .addCase(discoveryActions.updateDiscovery, (state, { payload }) => {
                update(state, payload);
            })
            .addCase(discoveryActions.interruptDiscovery, (state, { payload }) => {
                update(state, payload);
            })
            .addCase(discoveryActions.completeDiscovery, (state, { payload }) => {
                update(state, payload, true);
            })
            .addCase(discoveryActions.stopDiscovery, (state, { payload }) => {
                update(state, payload, true);
            })
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                extra.reducers.storageLoadDiscovery,
            );
    },
);

export const selectDiscovery = (state: DiscoveryRootState) => state.wallet.discovery;

// Get discovery process for deviceState.
export const selectDiscoveryByDeviceState = (
    state: DiscoveryRootState,
    deviceState: string | undefined,
) => (deviceState ? state.wallet.discovery.find(d => d.deviceState === deviceState) : undefined);

export const selectDeviceDiscovery = (state: DiscoveryRootState & DeviceRootState) => {
    const selectedDevice = selectDevice(state);

    return selectDiscoveryByDeviceState(state, selectedDevice?.state);
};

export const selectIsDeviceDiscoveryActive = (state: DiscoveryRootState & DeviceRootState) => {
    const discovery = selectDeviceDiscovery(state);

    if (!discovery) return false;

    return (
        discovery.status === DiscoveryStatus.RUNNING ||
        discovery.status === DiscoveryStatus.STOPPING
    );
};

/**
 * Helper selector called from components
 * return `true` if discovery process is running/completed and `authConfirm` is required
 */
export const selectIsDiscoveryAuthConfirmationRequired = (
    state: DiscoveryRootState & DeviceRootState,
) => {
    const discovery = selectDeviceDiscovery(state);

    return (
        discovery &&
        discovery.authConfirm &&
        (discovery.status < DiscoveryStatus.STOPPING ||
            discovery.status === DiscoveryStatus.COMPLETED)
    );
};

export const selectDevicelessDiscoveries = (state: DiscoveryRootState & DeviceRootState) => {
    const persistedDeviceStates = selectPersistedDeviceStates(state);

    return pipe(
        selectDiscovery(state),
        A.filter(discovery => !persistedDeviceStates.includes(discovery.deviceState)),
    ) as Discovery[];
};
