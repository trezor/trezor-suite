import { type AnyAction } from '@reduxjs/toolkit';
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

interface Middleware<
    _DispatchExt = Record<never, never>,
    S = any,
    D extends Dispatch = Dispatch<any>,
> {
    (api: MiddlewareAPI<D, S>): (next: Dispatch<AnyAction>) => (action: any) => any;
}

/**
 * @deprecated Use configureStore from @suite-common/test-utils instead.
 */
export const configureStore = <S, DispatchExts = Record<never, never>>(
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
