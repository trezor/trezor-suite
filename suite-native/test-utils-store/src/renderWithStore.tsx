import { type ReactElement } from 'react';

import { type Store } from '@reduxjs/toolkit';
import {
    type RenderHookOptions,
    type RenderHookResult,
    type RenderOptions,
    type RenderResult,
    render,
    renderHook,
} from '@testing-library/react-native';

import { StoreProviderForTests } from './StoreProviderForTests';
import { createStoreFromPreloadedState } from './createStoreFromPreloadedState';

export type RenderOptionsExtended<TServices extends object = object> = RenderOptions & {
    preloadedState?: object;
    services?: TServices & { store?: Store };
};

export type RenderHookOptionsExtended<
    Props,
    TServices extends object = object,
> = RenderHookOptions<Props> & {
    preloadedState?: object;
    services?: TServices & { store?: Store };
};

export const renderWithStoreProvider = async <TServices extends object>(
    element: ReactElement,
    {
        preloadedState,
        services,
        wrapper: Wrapper,
        ...options
    }: RenderOptionsExtended<TServices> = {},
): Promise<RenderResult> => {
    const resolvedServices = {
        ...services,
        store: services?.store ?? createStoreFromPreloadedState(preloadedState),
    };

    return await render(element, {
        wrapper: ({ children }) => (
            <StoreProviderForTests services={resolvedServices}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </StoreProviderForTests>
        ),
        ...options,
    });
};

export const renderHookWithStoreProvider = async <
    Result = unknown,
    Props = unknown,
    TServices extends object = object,
>(
    callback: (props: Props) => Result,
    {
        preloadedState,
        services,
        wrapper: Wrapper,
        ...options
    }: RenderHookOptionsExtended<Props, TServices> = {},
): Promise<RenderHookResult<Result, Props>> => {
    const resolvedServices = {
        ...services,
        store: services?.store ?? createStoreFromPreloadedState(preloadedState),
    };

    return await renderHook(callback, {
        wrapper: ({ children }) => (
            <StoreProviderForTests services={resolvedServices}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </StoreProviderForTests>
        ),
        ...options,
    });
};
