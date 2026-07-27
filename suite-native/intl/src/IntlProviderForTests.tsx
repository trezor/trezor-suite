import { useContext, useMemo } from 'react';
import { IntlProvider as ReactIntlProvider } from 'react-intl';
import { Provider, ReactReduxContext } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';

import { localeReducer } from './localeSlice';
import { messages } from './messages';
import { flatten } from './utils';

// For uni test we always expect the messages to be in english, so the language selection logic can be omitted here.
const flatMessages = flatten(messages);

// Some tests mock out `react-redux` entirely, in which case there is no context/`Provider` to use
// (and `useSelector` is already stubbed, so no real store is needed).
const isReduxAvailable = ReactReduxContext != null && Provider != null;

// Intl components (`Translation`, `useTranslate`) read from the redux `locale` slice, so they need a
// store in the tree. Provides a minimal fallback store only when a test hasn't supplied its own,
// so store-based tests keep using even where there is not real redux provider implemented.
const StoreFallback = ({ children }: { children: React.ReactNode }) => {
    const hasStore = useContext(ReactReduxContext) !== null;
    const store = useMemo(() => configureStore({ reducer: { locale: localeReducer } }), []);

    if (hasStore) {
        return <>{children}</>;
    }

    return <Provider store={store}>{children}</Provider>;
};

const FallbackStoreProvider = ({ children }: { children: React.ReactNode }) =>
    isReduxAvailable ? <StoreFallback>{children}</StoreFallback> : <>{children}</>;

export const IntlProviderForTests = ({ children }: { children: React.ReactNode }) => (
    <FallbackStoreProvider>
        <ReactIntlProvider locale="en-US" messages={flatMessages}>
            {children}
        </ReactIntlProvider>
    </FallbackStoreProvider>
);
