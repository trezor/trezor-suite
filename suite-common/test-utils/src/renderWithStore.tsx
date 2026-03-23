import { Provider } from 'react-redux';

import { type Store } from '@reduxjs/toolkit';
import { type RenderHookOptions, renderHook } from '@testing-library/react';

export type TestStore = Store;

type RenderHookOptionsExtended<Props> = RenderHookOptions<Props> & {
    store: TestStore;
};

export const renderHookWithStoreProvider = <Result, Props>(
    callback: (props: Props) => Result,
    { wrapper: Wrapper, store, ...options }: RenderHookOptionsExtended<Props>,
) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <Provider store={store}>{Wrapper ? <Wrapper>{children}</Wrapper> : children}</Provider>
        ),
        ...options,
    });
