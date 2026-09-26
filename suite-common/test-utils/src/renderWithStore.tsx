import { Provider } from 'react-redux';

import { type Store } from '@reduxjs/toolkit';
import { type RenderHookOptions, renderHook } from '@testing-library/react';

import { ServicesProvider } from '@suite-common/dependency-injection';

export type TestStore = Store;

export type TestServices = { store: TestStore };

type RenderHookOptionsExtended<Props> = RenderHookOptions<Props> & { services: TestServices };

export const renderHookWithStoreProvider = <Result, Props>(
    callback: (props: Props) => Result,
    { wrapper: Wrapper, services, ...options }: RenderHookOptionsExtended<Props>,
) =>
    renderHook(callback, {
        wrapper: ({ children }) => (
            <Provider store={services.store}>
                <ServicesProvider services={services}>
                    {Wrapper ? <Wrapper>{children}</Wrapper> : children}
                </ServicesProvider>
            </Provider>
        ),
        ...options,
    });
