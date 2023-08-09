/* eslint-disable @typescript-eslint/ban-types */
import { AnyAction, isFulfilled, isPending, Middleware } from '@reduxjs/toolkit';
import reduxMockStore, { MockStoreCreator } from 'redux-mock-store';
import thunk from 'redux-thunk';

import { extraDependencies } from '../extraDependencies';

/**
 * @deprecated Use configureStore from @suite-common/test-utils instead.
 */
export const configureStore = <S, DispatchExts = {}>(
    middlewares?: Middleware[],
): MockStoreCreator<S, DispatchExts> =>
    reduxMockStore([thunk.withExtraArgument(extraDependencies), ...(middlewares || [])]);

/*
 * This function is useful, because lot of test fixtures doesn't count with added thunk pending/fulfilled action that are now
 * dispatched everytime. This will filter out these action so we don't need to fix fixtures everywhere.
 * It should be used only in /packages/suite everything migrated to suite-common/ should be adjusted to work with new thunk API!!!
 */
export const filterThunkActionTypes = (actions: AnyAction[]) =>
    actions.filter(action => !isPending(action) && !isFulfilled(action));
