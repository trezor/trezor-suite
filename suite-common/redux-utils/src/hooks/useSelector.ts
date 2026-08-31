import {
    type TypedUseSelectorHook,
    // eslint-disable-next-line @typescript-eslint/no-restricted-imports -- This module owns the shared shallow-equality behavior.
    shallowEqual,
    useSelector as useReduxSelector,
} from 'react-redux';

/**
 * Applications add their complete Redux state to this registry once. Packages without an
 * application root create a hook with their smaller state contract through `createUseSelector`.
 * The reserved property keeps the interface non-empty before an application extends it.
 */
export interface UseSelectorStateRegistry {
    readonly __reduxUtils?: never;
}

type RegisteredUseSelectorStateKey = Exclude<keyof UseSelectorStateRegistry, '__reduxUtils'>;

export type UseSelectorState = [RegisteredUseSelectorStateKey] extends [never]
    ? Record<never, never>
    : UseSelectorStateRegistry[RegisteredUseSelectorStateKey];

export const createUseSelector =
    <TState>(): TypedUseSelectorHook<TState> =>
    (selector, equalityFnOrOptions = shallowEqual) =>
        useReduxSelector(selector, equalityFnOrOptions);

export const useSelector: TypedUseSelectorHook<UseSelectorState> =
    createUseSelector<UseSelectorState>();

export { shallowEqual };
