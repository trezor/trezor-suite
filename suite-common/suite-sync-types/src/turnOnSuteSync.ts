import { Dispatch } from '@reduxjs/toolkit';

import { TurnOnSuiteSyncForWallet } from './storage/turnOnSuiteSyncForWallet';

export type TurnOnSuiteSync = () => void;

export type TurnOnSuiteSyncDep = { turnOnSuiteSync: TurnOnSuiteSync };

export type CreateTurnOnSuiteSyncDeps = {
    getState: () => any;
    dispatch: Dispatch;
    turnOnSuiteSyncForWallet: TurnOnSuiteSyncForWallet;
};
