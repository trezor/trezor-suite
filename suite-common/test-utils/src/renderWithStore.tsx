import { type ReactNode } from 'react';
import { Provider } from 'react-redux';

import { type Store } from '@reduxjs/toolkit';
import { type RenderHookOptions, renderHook } from '@testing-library/react';

import { ServicesProvider } from '@suite-common/dependency-injection';

import { type TestAppRoot } from './createTestCompositionRoot';

export type TestStore = Store;

type RenderHookOptionsExtended<Props> = RenderHookOptions<Props> &
    ({ root: TestAppRoot; store?: never } | { store: TestStore; root?: never });

export const renderHookWithStoreProvider = <Result, Props>(
    callback: (props: Props) => Result,
    { wrapper: Wrapper, store, root, ...options }: RenderHookOptionsExtended<Props>,
) => {
    const reduxStore = root?.store ?? store;
    if (!reduxStore) {
        throw new Error('Expected a store or root.');
    }

    const childrenWithProviders = (children: ReactNode) => {
        const wrappedChildren = Wrapper ? <Wrapper>{children}</Wrapper> : children;

        return root ? (
            <ServicesProvider services={root.services}>{wrappedChildren}</ServicesProvider>
        ) : (
            wrappedChildren
        );
    };

    return renderHook(callback, {
        wrapper: ({ children }) => (
            <Provider store={reduxStore}>{childrenWithProviders(children)}</Provider>
        ),
        ...options,
    });
};
