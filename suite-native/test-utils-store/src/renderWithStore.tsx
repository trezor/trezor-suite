import { type ReactElement } from 'react';

import {
    type RenderHookOptions,
    type RenderOptions,
    render,
    renderHook,
} from '@testing-library/react-native';

import { StoreProviderForTests, type TestStore } from './StoreProviderForTests';

export type RenderOptionsExtended = RenderOptions & {
    preloadedState?: Record<string, unknown>;
    store?: TestStore;
};

export type RenderHookOptionsExtended<Props> = RenderHookOptions<Props> & {
    preloadedState?: Record<string, unknown>;
    store?: TestStore;
};

export const renderWithStoreProvider = (
    element: ReactElement,
    { preloadedState, wrapper: Wrapper, store, ...options }: RenderOptionsExtended = {},
) =>
    render(element, {
        wrapper: ({ children }) => (
            <StoreProviderForTests preloadedState={preloadedState} injectedStore={store}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </StoreProviderForTests>
        ),
        ...options,
    });

export const renderHookWithStoreProvider = <Result = unknown, Props = unknown>(
    callback: (props: Props) => Result,
    { preloadedState, wrapper: Wrapper, store, ...options }: RenderHookOptionsExtended<Props> = {},
) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <StoreProviderForTests preloadedState={preloadedState} injectedStore={store}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </StoreProviderForTests>
        ),
        ...options,
    });
