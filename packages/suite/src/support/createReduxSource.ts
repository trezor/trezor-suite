import type { ExternalStore } from '@trezor/network-module-suite-common-types';

export type ReduxSourceDeps<TState, TValue> = {
    getState: () => TState;
    subscribe: (listener: () => void) => () => void;

    /** A memoized selector: the same reference while the value is unchanged. */
    select: (state: TState) => TValue;
};

/** A value of the Redux store as an external store, for consumers that do not depend on Redux. */
export type ReduxSource<TValue> = ExternalStore<TValue>;

/**
 * Reads a value that still lives in Redux (a setting, a flag, a signed config) as an external
 * store. A listener is called only when the selected value changes, not on every action.
 */
export const createReduxSource = <TState, TValue>(
    deps: ReduxSourceDeps<TState, TValue>,
): ReduxSource<TValue> => ({
    getSnapshot: () => deps.select(deps.getState()),
    subscribe: listener => {
        let last = deps.select(deps.getState());

        return deps.subscribe(() => {
            const next = deps.select(deps.getState());
            if (Object.is(next, last)) return;

            last = next;
            listener();
        });
    },
});
