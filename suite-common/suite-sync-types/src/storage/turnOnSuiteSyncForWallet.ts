import { Dispatch } from '@reduxjs/toolkit';

import { StaticSessionId } from '@trezor/connect';

import { SubscribeLabeling } from '../labeling/subscribeLabeling';
import { RefreshSuiteSyncKeys } from '../refreshSuiteSyncKeys';

export type TurnOnSuiteSyncForWalletDeps = {
    dispatch: Dispatch;
    getState: () => any;
    subscribeLabeling: SubscribeLabeling;
    refreshSuiteSyncKeys: RefreshSuiteSyncKeys;
};

export type TurnOnSuiteSyncForWalletParams = { staticSessionId: StaticSessionId | undefined };

export type TurnOnSuiteSyncForWallet = (params: TurnOnSuiteSyncForWalletParams) => Promise<void>;

export type TurnOnSuiteSyncForWalletDep = {
    turnOnSuiteSyncForWallet: TurnOnSuiteSyncForWallet;
};
