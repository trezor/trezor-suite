import { type Dispatch } from '@reduxjs/toolkit';

import {
    type ChangeRelayUrl,
    type GetIsTorEnabledDep,
    type ReconnectAllRelaysDep,
} from '@suite-common/suite-sync-types';

import { setSuiteSyncRelayUrl } from '../suiteSyncSlice';

export type ChangeRelayUrlDeps = {
    dispatch: Dispatch;
} & GetIsTorEnabledDep &
    ReconnectAllRelaysDep;

export const createChangeRelayUrl =
    (deps: ChangeRelayUrlDeps): ChangeRelayUrl =>
    async ({ relayUrl }) => {
        deps.dispatch(setSuiteSyncRelayUrl({ url: relayUrl }));

        await deps.reconnectAllRelays({ isTorEnabled: deps.getIsTorEnabled() });
    };
