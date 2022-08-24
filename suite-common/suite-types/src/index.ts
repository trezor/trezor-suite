import { ActionCreatorWithoutPayload, ActionCreatorWithPayload, AnyAction } from '@reduxjs/toolkit';

export * from './device';
export * from './environment';
export * from './guide';
export * from './messageSystem';

export type Selector<TReturnValue> = (state: any) => TReturnValue;
export type SuiteCompatibleAction<TPayload> = (
    payload: TPayload,
) => AnyAction | ActionCreatorWithPayload<TPayload> | ActionCreatorWithoutPayload;
