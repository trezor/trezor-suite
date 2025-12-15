import { type MiddlewareAPI } from '@reduxjs/toolkit';
import { withExtraArgument } from 'redux-thunk';

type CreateStoreWithExtraStoreMiddlewareParams<T> = {
    extraFactory: (api: MiddlewareAPI) => T;
    onExtraCreated?: (extra: T) => void;
};

export const createStoreWithExtraStoreMiddleware =
    <T>({ extraFactory, onExtraCreated }: CreateStoreWithExtraStoreMiddlewareParams<T>) =>
    (api: MiddlewareAPI) => {
        const extra = extraFactory(api);
        onExtraCreated?.(extra);

        return withExtraArgument(extra)(api);
    };
