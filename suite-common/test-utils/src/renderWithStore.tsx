import { Provider } from 'react-redux';

import { type Store } from '@reduxjs/toolkit';
import { type RenderHookOptions, renderHook } from '@testing-library/react';

import { ServicesProvider } from '@suite-common/dependency-injection';

type RenderHookOptionsExtended<
    Props,
    Services extends { store: Store },
> = RenderHookOptions<Props> & {
    services: Services;
};

export const renderHookWithStoreProvider = <Result, Props, Services extends { store: Store }>(
    callback: (props: Props) => Result,
    { wrapper: Wrapper, services, ...options }: RenderHookOptionsExtended<Props, Services>,
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
