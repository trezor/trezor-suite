import {
    type ActionCreatorWithPayload,
    type ActionCreatorWithoutPayload,
    type AnyAction,
} from '@reduxjs/toolkit';

export * from './device';
export type * from './deviceAccess';
export * from './firmware';
export type * from './connectInit';
export type * from './guide';
export type * from './messageSystem';
export type * from './modal';
export * from './reload';
export * from './staking';
export type * from './trezorConnect';
export * from './walletBackupType';
export type * from './sign';
export type * from './thp';
export * from './languages';
export type * from './window';

export type SuiteCompatibleAction<TPayload> = (
    payload: TPayload,
) => AnyAction | ActionCreatorWithPayload<TPayload> | ActionCreatorWithoutPayload;
