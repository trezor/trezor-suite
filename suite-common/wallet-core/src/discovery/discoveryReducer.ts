import { PayloadAction } from '@reduxjs/toolkit';

import { createDeferred } from '@trezor/utils';
import { Discovery, PartialDiscovery } from '@suite-common/wallet-types';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { discoveryActions } from './discoveryActions';

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

export const selectDiscovery = (state: DiscoveryRootState) => state.wallet.discovery;

// Get discovery process for deviceState.
export const selectDiscoveryByDeviceState = (
    state: DiscoveryRootState,
    deviceState: string | undefined,
) => (deviceState ? state.wallet.discovery.find(d => d.deviceState === deviceState) : undefined);
