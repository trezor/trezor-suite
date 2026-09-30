import { type UnknownAction } from '@reduxjs/toolkit';

import { type WithServices } from '@suite-common/redux-utils';

import {
    type CreateTestStoreParams,
    type TestStoreResult,
    createTestStore,
} from './createTestStore';

type TestExtra = WithServices<object>;

export type TestAppRoot = {
    store: Omit<TestStoreResult, 'getActions' | 'clearActions'>;
    services: Pick<TestStoreResult, 'dispatch' | 'getActions' | 'clearActions'>;
};

// `extra` can be omitted only when `Extra` requires no services.
type ExtraParams<Extra extends TestExtra> = TestExtra extends Extra
    ? { extra?: Extra }
    : { extra: Extra };

type CreateTestCompositionRootParams<Extra extends TestExtra, S, A extends UnknownAction> = Omit<
    CreateTestStoreParams<S, A, Extra>,
    'extra'
> &
    ExtraParams<Extra>;

export const createTestCompositionRoot = <
    Extra extends TestExtra = TestExtra,
    S = any,
    A extends UnknownAction = UnknownAction,
>({
    extra = { services: {} } as Extra,
    ...storeParams
}: CreateTestCompositionRootParams<Extra, S, A>) => {
    const { getActions, clearActions, ...store } = createTestStore({
        ...storeParams,
        extra,
    });

    return {
        store,
        services: {
            ...extra.services,
            store,
            dispatch: store.dispatch,
            getActions,
            clearActions,
        },
    };
};
