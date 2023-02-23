import { ActionCreatorWithoutPayload, ActionCreatorWithPayload, AnyAction } from '@reduxjs/toolkit';

export * from './device';
export * from './guide';
export * from './sign';
export * from './github';

export type Selector<TReturnValue> = (state: any) => TReturnValue;
export type SuiteCompatibleAction<TPayload> = (
    payload: TPayload,
) => AnyAction | ActionCreatorWithPayload<TPayload> | ActionCreatorWithoutPayload;
