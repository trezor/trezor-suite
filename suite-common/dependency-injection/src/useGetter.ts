import React from 'react';
import { shallowEqual, useSelector } from 'react-redux';

import { type UnionToIntersection } from '@trezor/type-utils';
import { typedObjectValues } from '@trezor/utils';

import { type Getter } from './toGetter';
import { type SelectorResult, type ServiceSelector, useServicesContext } from './useServices';

// The single key of a one-property object; `never` for anything else (an intersection of two or
// more distinct string literals is `never`).
type OnlyKey<TSelected> = [UnionToIntersection<keyof TSelected>] extends [never]
    ? never
    : keyof TSelected;

type OnlyGetter<TSelected> = [OnlyKey<TSelected>] extends [never]
    ? never
    : TSelected[OnlyKey<TSelected>] extends Getter<any[], any>
      ? TSelected[OnlyKey<TSelected>]
      : never;

type GetterParams<TSelected> =
    OnlyGetter<TSelected> extends Getter<infer TParams, any>
        ? TParams
        : ['This dependency must hold exactly one getter.'];

type GetterReturn<TSelected> =
    OnlyGetter<TSelected> extends Getter<any[], infer TReturn>
        ? TReturn
        : 'This dependency must hold exactly one getter.';

/**
 * Reads the value of an injected getter-service reactively: the component re-renders whenever the
 * value changes, the same as with a plain selector. Takes the same dependency selector as
 * `useServices`, holding a single getter, and returns that getter's current value.
 *
 * The store state is never handed to the getter — it reads the state through its own `getState`, so
 * the component (and its test) stays independent of the state shape and only has to mock the getter.
 * Subscribing through `useSelector` is what re-evaluates the getter on every store change.
 *
 * ```ts
 * const allowPrerelease = useGetter(selectGetAllowPrereleaseDep);
 * ```
 *
 * The value is compared shallowly, so a getter returning a fresh object holding the same values on
 * every call does not re-render. Anything nested deeper still has to keep its identity stable, which
 * usually means building the getter on a memoized selector.
 */
export function useGetter<const TSelector extends ServiceSelector<any>>(
    selectGetterDep: TSelector,
    ...params: GetterParams<SelectorResult<TSelector>>
): GetterReturn<SelectorResult<TSelector>>;

export function useGetter(selectGetterDep: ServiceSelector<any>, ...params: unknown[]) {
    const services = useServicesContext();

    const getter = React.useMemo(() => {
        const [onlyGetter, ...rest] = typedObjectValues<Record<string, Getter<unknown[], unknown>>>(
            selectGetterDep(services),
        );

        if (onlyGetter === undefined || rest.length > 0) {
            throw new Error(
                `useGetter expects a dependency with exactly one getter, got ${rest.length + (onlyGetter === undefined ? 0 : 1)}`,
            );
        }

        return onlyGetter;
    }, [services, selectGetterDep]);

    return useSelector(() => getter(...params), shallowEqual);
}
