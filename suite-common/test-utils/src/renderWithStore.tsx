import { Provider } from 'react-redux';

import { type Store } from '@reduxjs/toolkit';
import { type RenderHookOptions, renderHook } from '@testing-library/react';

import { ServicesProvider } from '@suite-common/dependency-injection';

import { type TestAppRoot } from './createTestCompositionRoot';

export type TestStore = Store;

type RenderHookOptionsExtended<Props> = RenderHookOptions<Props> & { root: TestAppRoot };

export const renderHookWithStoreProvider = <Result, Props>(
    callback: (props: Props) => Result,
    { wrapper: Wrapper, root, ...options }: RenderHookOptionsExtended<Props>,
) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <Provider store={root.store}>
                <ServicesProvider services={root.services}>
                    {Wrapper ? <Wrapper>{children}</Wrapper> : children}
                </ServicesProvider>
            </Provider>
        ),
        ...options,
    });
