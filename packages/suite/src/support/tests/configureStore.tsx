import { AnyAction, isFulfilled, isPending } from '@reduxjs/toolkit';
import { Dispatch } from 'redux';
import reduxMockStore, { MockStoreCreator } from 'redux-mock-store';
import { withExtraArgument } from 'redux-thunk';

import { extraDependencies } from '../extraDependencies';

interface MiddlewareAPI<D extends Dispatch = Dispatch<AnyAction>, S = any> {
    dispatch: D;
    getState(): S;
}

interface Middleware<_DispatchExt = {}, S = any, D extends Dispatch = Dispatch<any>> {
    (api: MiddlewareAPI<D, S>): (next: Dispatch<AnyAction>) => (action: any) => any;
}

/**
 * @deprecated Use configureStore from @suite-common/test-utils instead.
 */
export const configureStore = <S, DispatchExts = {}>(
    middlewares?: Middleware[],
): MockStoreCreator<S, DispatchExts> =>
    reduxMockStore([withExtraArgument(extraDependencies), ...(middlewares || [])]);

/*
 * This function is useful, because a lot of test fixtures doesn't count with added thunk pending/fulfilled action that are now
 * dispatched everytime. This will filter out these action so we don't need to fix fixtures everywhere.
 * It should be used only in /packages/suite everything migrated to suite-common/ should be adjusted to work with new thunk API!!!
 */
export const filterThunkActionTypes = (actions: AnyAction[]) =>
    actions.filter(action => !isPending(action) && !isFulfilled(action));
