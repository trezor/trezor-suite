import { Dispatch } from '@reduxjs/toolkit';

import {
    RefreshSuiteSyncKeysDep,
    SubscribeSuiteSyncDataDep,
    TurnOnSuiteSyncForWallet,
} from '@suite-common/suite-sync-types';
import { selectDeviceByStaticSessionId } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';
import { ok } from '@trezor/type-utils';

import { isSuiteSyncSupportedByDevice } from '../suiteSyncUtils';

export type TurnOnSuiteSyncForWalletDeps = {
    dispatch: Dispatch;
    getState: () => any;
} & SubscribeSuiteSyncDataDep &
    RefreshSuiteSyncKeysDep;

export const createTurnOnSuiteSyncForWallet =
    (deps: TurnOnSuiteSyncForWalletDeps): TurnOnSuiteSyncForWallet =>
    async ({ deviceStaticSessionId }) => {
        const device = selectDeviceByStaticSessionId(deps.getState(), deviceStaticSessionId);

        const canTurnOnSuiteSync =
            device && isTrezorDeviceWithState(device) && isSuiteSyncSupportedByDevice(device);

        if (!canTurnOnSuiteSync) {
            return ok();
        }

        return await deps.subscribeSuiteSyncData({ deviceStaticSessionId });
    };
