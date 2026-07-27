/**
 * The utils that provides a conversion from selector to a getter-service.
 *
 * Simply wrap any Redux selector with this + provide getState callback,
 * and you get a service, ready to be used in Dependency Injection.
 */
export function toGetter<TState, TReturn>(
    getState: () => TState,
    selector: (state: TState) => TReturn,
): () => TReturn;

export function toGetter<TState, TParams extends unknown[], TReturn>(
    getState: () => TState,
    selector: (state: TState, ...params: TParams) => TReturn,
): (...params: TParams) => TReturn;

export function toGetter<TState, TParams extends unknown[], TReturn>(
    getState: () => TState,
    selector: (state: TState, ...params: TParams) => TReturn,
) {
    return (...params: TParams): TReturn => selector(getState(), ...params);
}
