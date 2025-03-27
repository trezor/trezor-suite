import { Action, AsyncThunk, ThunkAction } from '@reduxjs/toolkit';

import { TrezorDevice } from '@suite-common/suite-types';
import { Discovery } from '@suite-common/wallet-types';

export interface AnyAction extends Action {
    [extraProps: string]: any;
}

// This SuiteCompatible types should be used only in places where you need support
// for both redux-toolkit and legacy redux stuff like it is in externalDependencies.
// Primary you should use types like ActionCreatorWithPayload from redux-toolkit!
export type SuiteCompatibleThunk<TPayload, TReturn = void> =
    | AsyncThunk<TReturn, TPayload, {}>
    | ((payload: TPayload) => ThunkAction<TReturn, any, any, AnyAction>);
export type SuiteCompatibleSelector<TReturn> = (state: any) => TReturn;

export type ActionType = string;

interface TypeGuard<T> {
    (value: any): value is T;
}
interface HasMatchFunction<T> {
    match: TypeGuard<T>;
}
type Matcher<T> = HasMatchFunction<T> | TypeGuard<T>;
type ActionFromMatcher<M extends Matcher<any>> = M extends Matcher<infer T> ? T : never;

type AnyAsyncThunk = {
    pending: {
        match: (action: any) => action is any;
    };
    fulfilled: {
        match: (action: any) => action is any;
    };
    rejected: {
        match: (action: any) => action is any;
    };
};
export type ActionsFromAsyncThunk<T extends AnyAsyncThunk> =
    | ActionFromMatcher<T['pending']>
    | ActionFromMatcher<T['fulfilled']>
    | ActionFromMatcher<T['rejected']>;

export type DiscoveryHook = {
    registerDiscoveryCompleteHook: (deviceToSelect: TrezorDevice) => Promise<{
        state: Discovery['deviceState'];
        device: TrezorDevice;
    }>;
    registerDiscoveryAuthHook: (device: TrezorDevice) => Promise<{
        state: Discovery['deviceState'];
        device: TrezorDevice;
    }>;
    triggerDiscoveryCompletedHooks: (
        deviceState: Discovery['deviceState'],
        device: TrezorDevice,
    ) => void;
    triggerDiscoveryAuthHooks: (
        deviceState: Discovery['deviceState'],
        device: TrezorDevice,
    ) => void;
    deregisterAuthHook: (device: TrezorDevice) => void;
};
