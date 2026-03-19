import { type ActionCreatorWithPayload, type ActionCreatorWithoutPayload } from '@reduxjs/toolkit';

import { type AnyAction } from '@suite-common/redux-utils';

export * from './device';
export type * from './firmware';
export type * from './github';
export type * from './guide';
export type * from './messageSystem';
export type * from './modal';
export * from './staking';
export * from './walletBackupType';
export type * from './sign';
export type * from './thp';
export * from './languages';

export type Selector<TReturnValue> = (state: any) => TReturnValue;
export type SuiteCompatibleAction<TPayload> = (
    payload: TPayload,
) => AnyAction | ActionCreatorWithPayload<TPayload> | ActionCreatorWithoutPayload;
