import { type AnyAction, isFulfilled, isPending } from '@reduxjs/toolkit';
import { type Dispatch } from 'redux';
import reduxMockStore, { type MockStoreCreator } from 'redux-mock-store';
import { withExtraArgument } from 'redux-thunk';

import type { ExtraDependencies } from '@suite-common/redux-utils';
import { mergeDeepObject } from '@trezor/utils';

import { type SuiteServices, extraDependencies } from '../extraDependencies';
import { extraDependenciesDesktopMock } from './extraDependenciesDesktop.mock';

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
    additionalExtraDeps: Partial<Omit<ExtraDependencies, 'services'>> &
        Partial<{ services: Partial<SuiteServices> }> = {},
): MockStoreCreator<S, DispatchExts> =>
    reduxMockStore([
        withExtraArgument(
            mergeDeepObject(extraDependenciesDesktopMock, extraDependencies, additionalExtraDeps),
        ),
        ...(middlewares || []),
    ]);

/*
 * This function is useful, because a lot of test fixtures doesn't count with added thunk pending/fulfilled action that are now
 * dispatched everytime. This will filter out these action so we don't need to fix fixtures everywhere.
 * It should be used only in /packages/suite everything migrated to suite-common/ should be adjusted to work with new thunk API!!!
 */
export const filterThunkActionTypes = (actions: AnyAction[]) =>
    actions.filter(action => !isPending(action) && !isFulfilled(action));
