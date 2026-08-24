import { type UnknownAction } from '@reduxjs/toolkit';

import {
    type CreateTestStoreParams,
    type TestStoreResult,
    createTestStore,
} from './createTestStore';

type TestCompositionRootServices<
    TStore extends TestStoreResult,
    TServices extends object,
> = TServices & Pick<TStore, 'dispatch' | 'getActions' | 'clearActions'>;

export type TestAppRoot<
    TStore extends TestStoreResult = TestStoreResult,
    TServices extends object = object,
> = {
    store: Omit<TStore, 'getActions' | 'clearActions'>;
    services: TestCompositionRootServices<TStore, TServices>;
};

export const createTestCompositionRoot = <
    Extra extends { services: object },
    S = any,
    A extends UnknownAction = UnknownAction,
>({
    extra,
    ...storeParams
}: CreateTestStoreParams<S, A, Extra>) => {
    const { getActions, clearActions, ...store } = createTestStore({
        ...storeParams,
        extra,
    });

    return {
        store,
        services: {
            ...extra.services,
            dispatch: store.dispatch,
            getActions,
            clearActions,
        },
    };
};
