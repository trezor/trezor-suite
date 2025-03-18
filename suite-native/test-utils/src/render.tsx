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
import { StoreProviderForTests } from './StoreProviderForTests';

export const renderWithBasicProvider = <Props,>(
    element: ReactElement<Props>,
    options: Omit<RenderOptions, 'wrapper'> = {},
) => render(element, { wrapper: BasicProviderForTests, ...options });

export const renderWithStoreProviderAsync = async <Props,>(
    element: ReactElement<Props>,
    {
        preloadedState,
        ...options
    }: Omit<RenderOptions, 'wrapper'> & {
        preloadedState?: PreloadedState;
    } = {},
) => {
    const ret = render(element, {
        wrapper: ({ children }) => (
            <StoreProviderForTests preloadedState={preloadedState}>
                {children}
            </StoreProviderForTests>
        ),
        ...options,
    });

    await waitFor(() => expect(ret.toJSON()).not.toBeNull());

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
        ...options
    }: Omit<RenderHookOptions<Props>, 'wrapper'> & {
        preloadedState?: PreloadedState;
    } = {},
) => {
    const ret = renderHook(callback, {
        wrapper: ({ children }) => (
            <StoreProviderForTests preloadedState={preloadedState}>
                {children}
            </StoreProviderForTests>
        ),
        ...options,
    });

    await waitFor(() => expect(ret.result.current).not.toBeNull());

    return ret;
};
