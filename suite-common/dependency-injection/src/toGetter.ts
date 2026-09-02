declare const getterBrand: unique symbol;

/**
 * A getter-service: reads a value out of the current Redux state without the caller having to know
 * the state shape.
 *
 * The brand is type-only. It exists so `useServices` can refuse to hand a getter to a component:
 * calling a getter during render reads the value once and never re-renders when it changes, so in
 * React a getter must be subscribed to with `useGetter`.
 */
export type Getter<TParams extends unknown[], TReturn> = ((...params: TParams) => TReturn) & {
    readonly [getterBrand]: true;
};

/**
 * Marks an existing function as a getter-service.
 *
 * For getters that are not derived from a selector — test mocks, constants, values read from
 * somewhere other than the store. Getters built from a selector should use `toGetter` instead.
 */
export const asGetter = <TParams extends unknown[], TReturn>(
    getter: (...params: TParams) => TReturn,
): Getter<TParams, TReturn> => getter as Getter<TParams, TReturn>;

/**
 * The utils that provides a conversion from selector to a getter-service.
 *
 * Simply wrap any Redux selector with this + provide getState callback,
 * and you get a service, ready to be used in Dependency Injection.
 */
export function toGetter<TState, TReturn>(
    getState: () => TState,
    selector: (state: TState) => TReturn,
): Getter<[], TReturn>;

export function toGetter<TState, TParams extends unknown[], TReturn>(
    getState: () => TState,
    selector: (state: TState, ...params: TParams) => TReturn,
): Getter<TParams, TReturn>;

export function toGetter<TState, TParams extends unknown[], TReturn>(
    getState: () => TState,
    selector: (state: TState, ...params: TParams) => TReturn,
) {
    return asGetter((...params: TParams): TReturn => selector(getState(), ...params));
}
