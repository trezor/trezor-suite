import type { ThunkDispatch } from 'redux-thunk';

import type { AppState as AppState$ } from '../reducers';
import type { MethodAction, TrezorConnectAction } from './actions';

export * from './common';
export * from './actions';

export type Action = MethodAction | TrezorConnectAction;

export type AppState = AppState$;

export interface Dispatch extends ThunkDispatch<AppState$, any, Action> {
    <A>(action: A): A extends (...args: any) => infer R ? R : A;
}
