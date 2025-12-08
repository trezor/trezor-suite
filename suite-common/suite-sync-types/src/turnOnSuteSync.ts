import { Dispatch } from '@reduxjs/toolkit';

export type TurnOnSuiteSync = () => void;

export type TurnOnSuiteSyncDep = { turnOnSuiteSync: TurnOnSuiteSync };

export type CreateTurnOnSuiteSyncDeps = {
    getState: () => any;
    dispatch: Dispatch;
};
