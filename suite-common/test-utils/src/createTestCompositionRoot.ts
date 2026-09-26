import { type UnknownAction } from '@reduxjs/toolkit';

import {
    type CreateTestStoreParams,
    type TestReduxStore,
    type TestStoreExtra,
    type TestStoreServices,
    createTestStore,
} from './createTestStore';

type CreateTestServices<S, Extra> = (
    store: TestReduxStore<S, UnknownAction, Extra>,
) => TestStoreServices<Extra>;

export type TestCompositionStore<S, Extra> = TestReduxStore<S, UnknownAction, Extra>;

type CreateTestCompositionRootParams<S, Extra> = CreateTestStoreParams<S, UnknownAction, Extra> &
    (Record<never, never> extends TestStoreServices<Extra>
        ? { services?: CreateTestServices<S, Extra> }
        : { services: CreateTestServices<S, Extra> });

// `Omit` keeps `store` typed even when the contract is `any`.
type TestCompositionRootServices<S, Extra> = Omit<TestStoreServices<Extra>, 'store'> & {
    store: TestCompositionStore<S, Extra>;
};

type TestCompositionRoot<S, Extra> = {
    services: TestCompositionRootServices<S, Extra>;
    extra: TestStoreExtra<Extra>;
};

// An omitted type argument falls back to this marker, which no real contract matches.
declare const _contractTypeArgumentIsRequired: unique symbol;

type ContractTypeArgumentIsRequired = { [_contractTypeArgumentIsRequired]: never };

type IsDeclaredContract<T> = 0 extends 1 & T
    ? false
    : [T] extends [ContractTypeArgumentIsRequired]
      ? false
      : true;

type ContractIsRequired =
    'Declare the Extra and State type arguments of createTestCompositionRoot; `any` is not a contract.';

// `NoInfer` keeps TypeScript from inferring the contract from `reducer` or `services`, so an
// omitted type argument stays the marker and the call is rejected.
type CreateTestCompositionRootArgs<S, Extra> = NoInfer<
    [IsDeclaredContract<Extra>, IsDeclaredContract<S>] extends [true, true]
        ? CreateTestCompositionRootParams<S, Extra>
        : ContractIsRequired
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
export const createTestCompositionRoot = <
    Extra = ContractTypeArgumentIsRequired,
    S = ContractTypeArgumentIsRequired,
>(
    params: CreateTestCompositionRootArgs<S, Extra>,
): TestCompositionRoot<S, Extra> => {
    // A call compiles only with a declared contract, where `params` is the root parameters.
    const rootParams = params as CreateTestCompositionRootParams<S, Extra>;
    const { services: createServices }: { services?: CreateTestServices<S, Extra> } = rootParams;
    const { store, injectServicesIntoReduxExtra, getExtra } = createTestStore<Extra, S>(rootParams);
    const services = Object.assign({}, createServices?.(store), { store });
    injectServicesIntoReduxExtra(services);

    return { services, extra: getExtra() };
};
