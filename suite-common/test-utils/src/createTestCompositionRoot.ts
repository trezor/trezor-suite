import { type UnknownAction } from '@reduxjs/toolkit';

import {
    type CreateTestStoreParams,
    type TestReduxStore,
    type TestStoreExtra,
    type TestStoreServices,
    createTestStore,
} from './createTestStore';

export type TestCompositionStore<S, Extra> = TestReduxStore<S, UnknownAction, Extra>;

type ComposeServices<S, Extra> = (
    store: TestCompositionStore<S, Extra>,
) => TestStoreServices<Extra>;

// `services` may be omitted only when the contract declares none.
type ServicesParam<S, Extra> =
    Record<never, never> extends TestStoreServices<Extra>
        ? { services?: ComposeServices<S, Extra> }
        : { services: ComposeServices<S, Extra> };

type CreateTestCompositionRootParams<S, Extra> = CreateTestStoreParams<S, UnknownAction, Extra> &
    ServicesParam<S, Extra>;

type TestCompositionRoot<S, Extra> = {
    // `Omit` keeps `store` typed even when the contract is `any`.
    services: Omit<TestStoreServices<Extra>, 'store'> & { store: TestCompositionStore<S, Extra> };
    extra: TestStoreExtra<Extra>;
};

// An omitted type argument defaults to `never`; neither `never` nor `any` is a contract.
type IsDeclaredContract<T> = 0 extends 1 & T ? false : [T] extends [never] ? false : true;

// `NoInfer` keeps TypeScript from inferring the contract from `reducer` or `services`, so an
// omitted type argument stays `never` and the call is rejected.
type CreateTestCompositionRootArgs<S, Extra> = NoInfer<
    [IsDeclaredContract<Extra>, IsDeclaredContract<S>] extends [true, true]
        ? CreateTestCompositionRootParams<S, Extra>
        : 'Declare the Extra and State type arguments of createTestCompositionRoot; `any` is not a contract.'
>;

/**
 * Composes a test the way the application composition roots do: creates the store, composes the
 * services from it and injects them, so thunks receive `{ ...extra, services }`.
 *
 * The store is part of the services and is accessed via `root.services.store`. Every test declares
 * its application contract: the thunk dependency contract as the first type argument (`void` when
 * nothing is injected) and the state shape as the second. They type-check the services, the static
 * `extra`, the reducer and every dispatched thunk.
 */
export const createTestCompositionRoot = <Extra = never, S = never>(
    params: CreateTestCompositionRootArgs<S, Extra>,
): TestCompositionRoot<S, Extra> => {
    // A call compiles only with a declared contract, where `params` is the root parameters.
    const rootParams = params as CreateTestCompositionRootParams<S, Extra>;
    const { store, injectServicesIntoReduxExtra, getExtra } = createTestStore<Extra, S>(rootParams);
    const services = Object.assign({}, rootParams.services?.(store), { store });
    injectServicesIntoReduxExtra(services);

    return { services, extra: getExtra() };
};
