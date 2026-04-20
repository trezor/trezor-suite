import {
    type ReducersMapObject,
    type StateFromReducersMapObject,
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
}: {
    reducer: R;
    preloadedState?: PreloadedStatePartial<StateFromReducersMapObject<R>>;
}) =>
    configureStore<StateFromReducersMapObject<R>>({
        reducer,
        preloadedState: preloadedState as StateFromReducersMapObject<R> | undefined,
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
    });
