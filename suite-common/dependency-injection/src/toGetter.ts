/**
 * A getter-service created by `toGetter`.
 */
export type Getter<TParams extends unknown[], TReturn> = ((...params: TParams) => TReturn) & {
    /**
     * The getter in the shape of a standard Redux selector, so a component can subscribe to it:
     * `const value = useSelector(getSomething.selector);`
     *
     * The passed state is deliberately ignored — the value is read through the getter's own
     * `getState`. The state argument exists only so `useSelector` re-evaluates on every store
     * change, which keeps the component (and its tests) independent of the state shape: mocking
     * the getter is enough, no store state has to be built.
     */
    selector: (state: unknown, ...params: TParams) => TReturn;
};

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
    const getter = (...params: TParams): TReturn => selector(getState(), ...params);

    return Object.assign(getter, {
        selector: (_state: unknown, ...params: TParams): TReturn => getter(...params),
    });
}
