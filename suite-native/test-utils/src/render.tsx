import { ReactElement } from 'react';

import {
    RenderHookOptions,
    RenderOptions,
    render,
    renderHook,
    waitFor,
} from '@testing-library/react-native';

import { PreloadedState } from '@suite-native/state';

import { BasicProviderForTests } from './BasicProviderForTests';
import { STORE_WARMING_UP_MSG, StoreProviderForTests, TestStore } from './StoreProviderForTests';

export const renderWithBasicProvider = <Props,>(
    element: ReactElement<Props>,
    options: Omit<RenderOptions, 'wrapper'> = {},
) => render(element, { wrapper: BasicProviderForTests, ...options });

export const renderWithStoreProviderAsync = async <Props,>(
    element: ReactElement<Props>,
    {
        preloadedState,
        store,
        ...options
    }: Omit<RenderOptions, 'wrapper'> & {
        preloadedState?: PreloadedState;
        store?: TestStore;
    } = {},
) => {
    const ret = render(element, {
        wrapper: ({ children }) => (
            <StoreProviderForTests preloadedState={preloadedState} injectedStore={store}>
                {children}
            </StoreProviderForTests>
        ),
        ...options,
    });

    await waitFor(() => expect(ret.queryByLabelText(STORE_WARMING_UP_MSG)).toBeNull());

    return ret;
};

export const renderHookWithBasicProvider = <Result, Props>(
    callback: (props: Props) => Result,
    options: Omit<RenderHookOptions<Props>, 'wrapper'> = {},
) => renderHook(callback, { wrapper: BasicProviderForTests, ...options });

export const renderHookWithStoreProviderAsync = async <Result, Props>(
    callback: (props: Props) => Result,
    {
        preloadedState,
        store,
        ...options
    }: Omit<RenderHookOptions<Props>, 'wrapper'> & {
        preloadedState?: PreloadedState;
        store?: TestStore;
    } = {},
) => {
    const ret = renderHook(callback, {
        wrapper: ({ children }) => (
            <StoreProviderForTests preloadedState={preloadedState} injectedStore={store}>
                {children}
            </StoreProviderForTests>
        ),
        ...options,
    });

    await waitFor(() => expect(ret.result.current).not.toBeNull());

    return ret;
};
