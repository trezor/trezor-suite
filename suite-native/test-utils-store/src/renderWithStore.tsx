import { type ReactElement } from 'react';

import {
    type RenderHookOptions,
    type RenderOptions,
    render,
    renderHook,
} from '@testing-library/react-native';

import type { PreloadedState } from '@suite-native/state';

import { StoreProviderForTests, type TestStore } from './StoreProviderForTests';

type RenderOptionsExtended = RenderOptions & {
    preloadedState?: PreloadedState;
    store?: TestStore;
};

type RenderHookOptionsExtended<Props> = RenderHookOptions<Props> & {
    preloadedState?: PreloadedState;
    store?: TestStore;
};

export const renderWithStoreProvider = <Props,>(
    element: ReactElement<Props>,
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

export const renderHookWithStoreProvider = <Result, Props>(
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
