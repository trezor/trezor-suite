import { type PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';

import { type PreloadedState } from '@trezor/suite';

import { BasicProviderForTests } from './BasicProviderForTests';
import { type TestStore, initStoreForTests } from './initStoreForTests';

export type { TestStore } from './initStoreForTests';

type ReduxProviderProps = {
    preloadedState?: PreloadedState;
    injectedStore?: TestStore;
} & PropsWithChildren;

export const StoreProviderForTests = ({
    children,
    injectedStore,
    preloadedState = {},
}: ReduxProviderProps) => {
    const store = useMemo(() => {
        if (injectedStore) {
            return injectedStore;
        }

        const { store: freshStore } = initStoreForTests(preloadedState);

        return freshStore;
    }, [injectedStore, preloadedState]);

    return (
        <Provider store={store}>
            <BasicProviderForTests>{children}</BasicProviderForTests>
        </Provider>
    );
};
