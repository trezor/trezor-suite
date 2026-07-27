import { type ReactElement } from 'react';

import {
    type RenderHookOptions,
    type RenderHookResult,
    type RenderOptions,
    type RenderResult,
    render,
    renderHook,
} from '@testing-library/react-native';

import { StoreProviderForTests, type TestStore } from './StoreProviderForTests';

export type RenderOptionsExtended = RenderOptions & {
    preloadedState?: Record<string, unknown>;
    services?: Record<string, unknown>;
    store?: TestStore;
};

export type RenderHookOptionsExtended<Props> = RenderHookOptions<Props> & {
    preloadedState?: Record<string, unknown>;
    services?: Record<string, unknown>;
    store?: TestStore;
};

export const renderWithStoreProvider = (
    element: ReactElement,
    { preloadedState, services, wrapper: Wrapper, store, ...options }: RenderOptionsExtended = {},
): RenderResult =>
    render(element, {
        wrapper: ({ children }) => (
            <StoreProviderForTests
                preloadedState={preloadedState}
                injectedStore={store}
                services={services}
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
        services,
        wrapper: Wrapper,
        store,
        ...options
    }: RenderHookOptionsExtended<Props> = {},
): RenderHookResult<Result, Props> =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <StoreProviderForTests
                preloadedState={preloadedState}
                injectedStore={store}
                services={services}
            >
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </StoreProviderForTests>
        ),
        ...options,
    });
