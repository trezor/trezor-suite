import { useSelector } from 'react-redux';

import { Dispatch } from '@reduxjs/toolkit';

import { selectDevices } from '@suite-common/wallet-core';
import { isTrezorDeviceWithState } from '@suite-common/wallet-utils';

import { TurnOffSuiteSyncForWalletDep } from './storage/turnOffSuiteSyncForWallet';
import { suiteSyncActions } from './suiteSyncActions';
import { selectIsSuiteSyncEnabled } from './suiteSyncSelectors';

export type TurnOffSuiteSync = () => Promise<void>;

export type TurnOffSuiteSyncDep = { turnOffSuiteSync: TurnOffSuiteSync };

type CreateTurnOffSuiteSyncDeps = {
    getState: () => any;
    dispatch: Dispatch;
} & TurnOffSuiteSyncForWalletDep;

export const createTurnOffSuiteSync =
    (deps: CreateTurnOffSuiteSyncDeps): TurnOffSuiteSync =>
    async () => {
        const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);

        if (!isSuiteSyncEnabled) {
            return;
        }

        deps.dispatch(suiteSyncActions.updateSuiteSyncEnabled({ isEnabled: false }));

        const devices = selectDevices(deps.getState()) ?? [];

        await Promise.all(
            devices
                .filter(isTrezorDeviceWithState)
                .map(device => deps.turnOffSuiteSyncForWallet({ device })),
        );
    };
