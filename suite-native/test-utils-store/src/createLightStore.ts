import {
    type Middleware,
    type ReducersMapObject,
    type StateFromReducersMapObject,
    type ThunkMiddleware,
    type Tuple,
    type UnknownAction,
    configureStore,
} from '@reduxjs/toolkit';

export type PreloadedStatePartial<T> = T extends (...args: never[]) => unknown
    ? T
    : T extends readonly unknown[]
      ? T
      : T extends object
        ? { [K in keyof T]?: PreloadedStatePartial<T[K]> }
        : T;

export const createLightStore = <R extends ReducersMapObject>({
    reducer,
    preloadedState,
    middleware = [],
}: {
    reducer: R;
    preloadedState?: PreloadedStatePartial<StateFromReducersMapObject<R>>;
    /** Appended to the default middleware, e.g. the middleware of an RTK Query API. */
    middleware?: Middleware[];
}) =>
    configureStore<
        StateFromReducersMapObject<R>,
        UnknownAction,
        Tuple<[ThunkMiddleware<StateFromReducersMapObject<R>>, ...Middleware[]]>
    >({
        reducer,
        preloadedState: preloadedState as StateFromReducersMapObject<R> | undefined,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(
                middleware,
            ),
    });
