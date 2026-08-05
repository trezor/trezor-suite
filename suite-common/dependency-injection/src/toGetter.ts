/**
 * A getter-service created by `toGetter`.
 *
 * Apart from being callable without the state, it exposes the original selector
 * under the `selector` property, so the very same dependency can be reused in React
 * components: `const value = useSelector(getSomething.selector);`
 */
export type Getter<TState, TParams extends unknown[], TReturn> = ((
    ...params: TParams
) => TReturn) & {
    selector: (state: TState, ...params: TParams) => TReturn;
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
): Getter<TState, [], TReturn>;

export function toGetter<TState, TParams extends unknown[], TReturn>(
    getState: () => TState,
    selector: (state: TState, ...params: TParams) => TReturn,
): Getter<TState, TParams, TReturn>;

export function toGetter<TState, TParams extends unknown[], TReturn>(
    getState: () => TState,
    selector: (state: TState, ...params: TParams) => TReturn,
) {
    const getter = (...params: TParams): TReturn => selector(getState(), ...params);

    return Object.assign(getter, { selector });
}
