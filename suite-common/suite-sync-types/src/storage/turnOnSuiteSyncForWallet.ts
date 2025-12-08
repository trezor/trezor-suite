import { Dispatch } from '@reduxjs/toolkit';

import { TrezorDeviceWithState } from '@suite-common/suite-types';

import { SubscribeLabeling } from '../labeling/subscribeLabeling';
import { RefreshSuiteSyncKeys } from '../refreshSuiteSyncKeys';

export type TurnOnSuiteSyncForWalletDeps = {
    dispatch: Dispatch;
    getState: () => any;
    subscribeLabeling: SubscribeLabeling;
    refreshSuiteSyncKeys: RefreshSuiteSyncKeys;
};

export type TurnOnSuiteSyncForWalletParams = { device: TrezorDeviceWithState };

export type TurnOnSuiteSyncForWallet = (params: TurnOnSuiteSyncForWalletParams) => Promise<void>;

export type TurnOnSuiteSyncForWalletDep = {
    turnOnSuiteSyncForWallet: TurnOnSuiteSyncForWallet;
};
