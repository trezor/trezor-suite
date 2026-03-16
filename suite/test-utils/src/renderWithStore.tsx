import { type ReactElement } from 'react';

import {
    type RenderHookOptions,
    type RenderOptions,
    render,
    renderHook,
} from '@testing-library/react';

import { type PreloadedState } from '@trezor/suite';

import { StoreProviderForTests, type TestStore } from './StoreProviderForTests';

type RenderWithStoreProviderOptions = {
    preloadedState?: PreloadedState;
    store?: TestStore;
};

export const renderWithStoreProvider = <Props,>(
    element: ReactElement<Props>,
    {
        preloadedState,
        store,
        wrapper: Wrapper,
        ...options
    }: RenderOptions & RenderWithStoreProviderOptions = {},
) =>
    render(element, {
        wrapper: ({ children }) => (
            <StoreProviderForTests preloadedState={preloadedState} injectedStore={store}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </StoreProviderForTests>
        ),
        ...options,
    });

export const renderHookWithStoreProvider = <Result, Props>(
    callback: (props: Props) => Result,
    {
        preloadedState,
        store,
        wrapper: Wrapper,
        ...options
    }: RenderHookOptions<Props> & RenderWithStoreProviderOptions = {},
) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <StoreProviderForTests preloadedState={preloadedState} injectedStore={store}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </StoreProviderForTests>
        ),
        ...options,
    });
