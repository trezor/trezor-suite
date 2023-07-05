import type { AppState } from 'src/types/suite';
import { discoveryActions } from 'src/actions/wallet/discoveryActions';
import { PayloadAction } from '@reduxjs/toolkit';

import { createDeferred } from '@trezor/utils';
import type { Discovery as CommonDiscovery } from '@suite-common/wallet-types';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { DiscoveryStatus } from '@suite-common/wallet-constants';

export type Discovery = CommonDiscovery;

export type PartialDiscovery = { deviceState: string } & Partial<Discovery>;

export type DiscoveryState = Discovery[];
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
            .addCase(
                discoveryActions.createDiscovery,
                (state, { payload }: PayloadAction<Discovery>) => {
                    const index = state.findIndex(d => d.deviceState === payload.deviceState);
                    if (index < 0) {
                        state.push(payload);
                    }
                },
            )
            .addCase(
                discoveryActions.startDiscovery,
                (state, { payload }: PayloadAction<Discovery>) => {
                    const index = state.findIndex(f => f.deviceState === payload.deviceState);
                    if (index >= 0) {
                        state[index] = {
                            ...state[index],
                            ...payload,
                            running: createDeferred(),
                        };
                    }
                },
            )
            .addCase(
                discoveryActions.removeDiscovery,
                (state, { payload }: PayloadAction<string>) => {
                    const index = state.findIndex(f => f.deviceState === payload);
                    state.splice(index, 1);
                },
            )
            .addCase(
                discoveryActions.updateDiscovery,
                (state, { payload }: PayloadAction<PartialDiscovery>) => {
                    update(state, payload);
                },
            )
            .addCase(
                discoveryActions.interruptDiscovery,
                (state, { payload }: PayloadAction<PartialDiscovery>) => {
                    update(state, payload);
                },
            )
            .addCase(
                discoveryActions.completeDiscovery,
                (state, { payload }: PayloadAction<PartialDiscovery>) => {
                    update(state, payload, true);
                },
            )
            .addCase(
                discoveryActions.stopDiscovery,
                (state, { payload }: PayloadAction<PartialDiscovery>) => {
                    update(state, payload, true);
                },
            )
            .addMatcher(
                action => action.type === extra.actionTypes.storageLoad,
                extra.reducers.storageLoadDiscovery,
            );
    },
);

type RootState = Pick<AppState, 'wallet' | 'suite'>;

export const selectDiscovery = (state: RootState) => state.wallet.discovery;

// Get discovery process for deviceState.
export const selectDiscoveryByDeviceState = (state: RootState, deviceState: string | undefined) =>
    deviceState ? state.wallet.discovery.find(d => d.deviceState === deviceState) : undefined;

export const selectDiscoveryForDevice = (state: RootState) =>
    selectDiscoveryByDeviceState(state, state.suite.device?.state);

/**
 * Helper selector called from components
 * return `true` if discovery process is running/completed and `authConfirm` is required
 */
export const selectIsDiscoveryAuthConfirmationRequired = (state: RootState) => {
    const discovery = selectDiscoveryForDevice(state);

    return (
        discovery &&
        discovery.authConfirm &&
        (discovery.status < DiscoveryStatus.STOPPING ||
            discovery.status === DiscoveryStatus.COMPLETED)
    );
};
