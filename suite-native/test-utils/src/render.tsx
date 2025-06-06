import { ReactElement } from 'react';

import {
    RenderHookOptions,
    RenderOptions,
    render,
    renderHook,
    waitFor,
} from '@testing-library/react-native';

import { FormatterProviderConfig } from '@suite-common/formatters';
import { PreloadedState } from '@suite-native/state';

import { BasicProviderForTests } from './BasicProviderForTests';
import { STORE_WARMING_UP_MSG, StoreProviderForTests, TestStore } from './StoreProviderForTests';

export const renderWithBasicProvider = <Props,>(
    element: ReactElement<Props>,
    {
        formattersConfig,
        wrapper: Wrapper,
        ...options
    }: RenderOptions & {
        formattersConfig?: FormatterProviderConfig;
    } = {},
) =>
    render(element, {
        wrapper: ({ children }) => (
            <BasicProviderForTests formattersConfig={formattersConfig}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </BasicProviderForTests>
        ),
        ...options,
    });

export const renderWithStoreProviderAsync = async <Props,>(
    element: ReactElement<Props>,
    {
        preloadedState,
        wrapper: Wrapper,
        store,
        ...options
    }: RenderOptions & {
        preloadedState?: PreloadedState;
        store?: TestStore;
    } = {},
) => {
    const ret = render(element, {
        wrapper: ({ children }) => (
            <StoreProviderForTests preloadedState={preloadedState} injectedStore={store}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </StoreProviderForTests>
        ),
        ...options,
    });

    await waitFor(() => expect(ret.queryByLabelText(STORE_WARMING_UP_MSG)).toBeNull());

    return ret;
};

export const renderHookWithBasicProvider = <Result, Props>(
    callback: (props: Props) => Result,
    {
        formattersConfig,
        wrapper: Wrapper,
        ...options
    }: RenderHookOptions<Props> & {
        formattersConfig?: FormatterProviderConfig;
    } = {},
) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <BasicProviderForTests formattersConfig={formattersConfig}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </BasicProviderForTests>
        ),
        ...options,
    });

export const renderHookWithStoreProviderAsync = async <Result, Props>(
    callback: (props: Props) => Result,
    {
        preloadedState,
        wrapper: Wrapper,
        store,
        ...options
    }: RenderHookOptions<Props> & {
        preloadedState?: PreloadedState;
        store?: TestStore;
    } = {},
) => {
    const ret = renderHook(callback, {
        wrapper: ({ children }) => (
            <StoreProviderForTests preloadedState={preloadedState} injectedStore={store}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </StoreProviderForTests>
        ),
        ...options,
    });

    await waitFor(() => expect(ret.result.current).not.toBeNull());

    return ret;
};
