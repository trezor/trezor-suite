import { type ReactElement } from 'react';

import {
    RenderHookOptions,
    RenderOptions,
    render,
    renderHook,
    waitFor,
} from '@testing-library/react-native';

import { PreloadedState } from '@suite-native/state';

import {
    STORE_WARMING_UP_MSG,
    StoreProviderForTests,
    type TestStore,
} from './StoreProviderForTests';

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
