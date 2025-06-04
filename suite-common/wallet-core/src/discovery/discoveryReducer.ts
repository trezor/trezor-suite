import { createReducerWithExtraDeps } from '@suite-common/redux-utils';
import { Discovery, DiscoveryStatus, Timestamp } from '@suite-common/wallet-types';
import { DeviceUniquePath } from '@trezor/connect';

import { discoveryActions } from './discoveryActions';

export type DiscoveryRootState = {
    wallet: {
        discovery: Discovery;
    };
};

const initialState: Discovery = {};

const update = (draft: Discovery, payload: { status: DiscoveryStatus; path: DeviceUniquePath }) => {
    if (!draft[payload.path]) {
        return;
    }

    const currentStatus = draft[payload.path];
    const hasLoadedAnyNonEmptyAccount: true | undefined =
        (currentStatus.status === 'progress' && currentStatus.hasLoadedAnyNonEmptyAccount) ||
        (payload.status.status === 'progress' && payload.status.hasLoadedAnyNonEmptyAccount) ||
        undefined;

    draft[payload.path] = {
        ...currentStatus,
        ...payload.status,
        ...{ hasLoadedAnyNonEmptyAccount },
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
                startTimestamp: Date.now() as Timestamp,
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
