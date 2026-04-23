import { type ReactElement } from 'react';

import {
    type RenderHookOptions,
    type RenderOptions,
    render,
    renderHook,
} from '@testing-library/react-native';

import type { ProviderKey } from '@suite-native/test-utils';

import { StoreProviderForTests, type TestStore } from './StoreProviderForTests';

export type RenderOptionsExtended = RenderOptions & {
    preloadedState?: Record<string, unknown>;
    store?: TestStore;
    providers?: ProviderKey[];
};

export type RenderHookOptionsExtended<Props> = RenderHookOptions<Props> & {
    preloadedState?: Record<string, unknown>;
    store?: TestStore;
    providers?: ProviderKey[];
};

export const renderWithStoreProvider = (
    element: ReactElement,
    { preloadedState, wrapper: Wrapper, store, providers, ...options }: RenderOptionsExtended = {},
) =>
    render(element, {
        wrapper: ({ children }) => (
            <StoreProviderForTests
                preloadedState={preloadedState}
                injectedStore={store}
                providers={providers}
            >
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </StoreProviderForTests>
        ),
        ...options,
    });

export const renderHookWithStoreProvider = <Result = unknown, Props = unknown>(
    callback: (props: Props) => Result,
    {
        preloadedState,
        wrapper: Wrapper,
        store,
        providers,
        ...options
    }: RenderHookOptionsExtended<Props> = {},
) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <StoreProviderForTests
                preloadedState={preloadedState}
                injectedStore={store}
                providers={providers}
            >
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </StoreProviderForTests>
        ),
        ...options,
    });
