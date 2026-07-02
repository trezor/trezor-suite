import { type Dispatch } from '@reduxjs/toolkit';

import {
    type ChangeRelayUrl,
    type GetIsTorEnabledDep,
    type ReconnectAllDep,
} from '@suite-common/suite-sync-types';

import { setSuiteSyncRelayUrl } from '../suiteSyncSlice';

export type ChangeRelayUrlDeps = {
    dispatch: Dispatch;
} & GetIsTorEnabledDep &
    ReconnectAllDep;

export const createChangeRelayUrl =
    (deps: ChangeRelayUrlDeps): ChangeRelayUrl =>
    async ({ relayUrl }) => {
        deps.dispatch(setSuiteSyncRelayUrl({ url: relayUrl }));

        await deps.reconnectAll({ isTorEnabled: deps.getIsTorEnabled() });
    };
