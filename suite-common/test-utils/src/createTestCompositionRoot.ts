import { type UnknownAction } from '@reduxjs/toolkit';

import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';

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

type CreateTestCompositionRootParams<S, A extends UnknownAction, Extra> = Omit<
    CreateTestStoreParams<S, A, Extra>,
    'extra'
> &
    ({ services: object } extends Extra ? { extra?: Extra } : { extra: Extra });

export const createTestCompositionRoot = <
    Extra extends { services: object } = { services: object },
    S = any,
    A extends UnknownAction = UnknownAction,
>({
    extra = { services: {} } as Extra,
    ...storeParams
}: CreateTestCompositionRootParams<S, A, Extra>) => {
    const services = {
        ...extra.services,
        networks: {
            ...mockNetworkConfigDeps(),
            ...(extra.services as { networks?: object }).networks,
        },
    };
    const { getActions, clearActions, ...store } = createTestStore({
        ...storeParams,
        extra: { ...extra, services },
    });

    return {
        store,
        services: {
            ...services,
            store,
            dispatch: store.dispatch,
            getActions,
            clearActions,
        },
    };
};
