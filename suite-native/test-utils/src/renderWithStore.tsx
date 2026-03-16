import { type ReactElement } from 'react';

import {
    type RenderHookOptions,
    type RenderOptions,
    render,
    renderHook,
    waitFor,
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

/**
 * @deprecated Use renderWithStoreProvider instead
 */
export const renderWithStoreProviderAsync = async <Props,>(
    element: ReactElement<Props>,
    options?: RenderOptionsExtended,
) => {
    const ret = renderWithStoreProvider(element, options);
    // There is no need to wait anymore, but keep the async logic here to maintain async behavior.
    await waitFor(() => expect(true).toBeTruthy());

    return ret;
};

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

/**
 * @deprecated Use renderHookWithStoreProvider instead
 */
export const renderHookWithStoreProviderAsync = async <Result, Props>(
    callback: (props: Props) => Result,
    options?: RenderHookOptionsExtended<Props>,
) => {
    const ret = renderHookWithStoreProvider(callback, options);
    // There is no need to wait anymore, but keep the async logic here to maintain async behavior.
    await waitFor(() => expect(ret.result.current).not.toBeNull());

    return ret;
};
