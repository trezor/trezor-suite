import { type ReactElement } from 'react';

import * as Reassure from 'reassure';

import { StoreProviderForTests, type TestStore } from './StoreProviderForTests';

Reassure.configure({ testingLibrary: 'react-native', runs: 10 });

export const measureRendersWithStoreProvider = <Props,>(
    element: ReactElement<Props>,
    {
        wrapper: Wrapper,
        store,
        ...options
    }: Reassure.MeasureRendersOptions & {
        store?: TestStore;
    } = {},
) =>
    Reassure.measureRenders(element, {
        wrapper: ({ children }) => (
            <StoreProviderForTests injectedStore={store}>
                {Wrapper ? <Wrapper>{children}</Wrapper> : children}
            </StoreProviderForTests>
        ),
        ...options,
    });

export { Reassure };
