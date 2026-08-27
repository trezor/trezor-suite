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

export const renderWithStoreProvider = async (
    element: ReactElement,
    { preloadedState, services, wrapper: Wrapper, store, ...options }: RenderOptionsExtended = {},
): Promise<RenderResult> =>
    await render(element, {
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

export const renderHookWithStoreProvider = async <Result = unknown, Props = unknown>(
    callback: (props: Props) => Result,
    {
        preloadedState,
        services,
        wrapper: Wrapper,
        store,
        ...options
    }: RenderHookOptionsExtended<Props> = {},
): Promise<RenderHookResult<Result, Props>> =>
    await renderHook(callback, {
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
