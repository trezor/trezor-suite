import { ActionCreatorWithPayload, ActionCreatorWithoutPayload, AnyAction } from '@reduxjs/toolkit';

export * from './device';
export * from './firmware';
export * from './github';
export * from './guide';
export * from './messageSystem';
export * from './modal';
export * from './route';
export * from './walletBackupType';
export * from './sign';
export * from './thp';

export type Selector<TReturnValue> = (state: any) => TReturnValue;
export type SuiteCompatibleAction<TPayload> = (
    payload: TPayload,
) => AnyAction | ActionCreatorWithPayload<TPayload> | ActionCreatorWithoutPayload;
