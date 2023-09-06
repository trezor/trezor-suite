import { ActionCreatorWithoutPayload, ActionCreatorWithPayload, AnyAction } from '@reduxjs/toolkit';

export * from './device';
export * from './guide';
export * from './firmware';
export * from './sign';
export * from './modal';
export * from './github';
export * from './messageSystem';
export * from './route';

export type Selector<TReturnValue> = (state: any) => TReturnValue;
export type SuiteCompatibleAction<TPayload> = (
    payload: TPayload,
) => AnyAction | ActionCreatorWithPayload<TPayload> | ActionCreatorWithoutPayload;
