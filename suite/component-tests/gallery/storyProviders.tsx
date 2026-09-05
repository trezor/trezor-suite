import { type PropsWithChildren, useMemo } from 'react';
import { Provider } from 'react-redux';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { IntlProviderForTests } from '@suite/intl';
// Deep import: the barrel's `jest.mock()` breaks in a browser; the alias shadows `exports`.
import { initStoreForTests } from '@suite/test-utils/src/initStoreForTests';
import { ServicesProvider } from '@suite-common/dependency-injection';
import { MockedFormatterProvider } from '@suite-common/formatters/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { type PreloadedState } from '@trezor/suite';
import Autodetect from '@trezor/suite/src/support/suite/Autodetect';
import { ConnectedIntlProvider } from '@trezor/suite/src/support/suite/ConnectedIntlProvider';
import { ConnectedThemeProvider } from '@trezor/suite/src/support/suite/ConnectedThemeProvider';
import { type DeepPartial } from '@trezor/type-utils';
import { mergeDeepObject } from '@trezor/utils';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

/**
 * One throwaway store, for the two things every story needs from a real one: each slice's initial
 * state, so a story only has to declare the values it cares about, and the app's own services.
 * (`mockInitialAppState` is no substitute for the state: it stubs `wallet` as an empty object,
 * which makes any selector reaching into a wallet slice throw.)
 */
const { store: initialStore, services } = initStoreForTests();
const initialAppState = initialStore.getState();

const WithServices = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
        <ServicesProvider services={services}>{children}</ServicesProvider>
    </QueryClientProvider>
);

/**
 * For display and validation stories: a mock store preloaded with the real initial state, patched
 * with whatever the story declares, and the translation catalogue rendered for real so assertions
 * can check user-facing copy.
 *
 * The reducers do not run, which is the point — state is exactly what the story asked for. Use
 * `RealStoreStory` instead when the component under test has to dispatch.
 */
export const MockStoreStory = ({
    children,
    preloadedState,
}: PropsWithChildren<{ preloadedState?: DeepPartial<PreloadedState> }>) => {
    const store = useMemo(
        () =>
            configureMockStore({
                extra: undefined,
                preloadedState: mergeDeepObject.withOptions(
                    { mergeArrays: false },
                    initialAppState,
                    preloadedState ?? {},
                ),
            }),
        [preloadedState],
    );

    return (
        <Provider store={store}>
            <WithServices>
                <ConnectedThemeProvider>
                    <IntlProviderForTests>
                        <MockedFormatterProvider>{children}</MockedFormatterProvider>
                    </IntlProviderForTests>
                </ConnectedThemeProvider>
            </WithServices>
        </Provider>
    );
};

/**
 * For stories whose subject dispatches and must see the result: a real store built by `initStore`,
 * wrapped in the app's own `Connected*` providers rather than test doubles.
 *
 * `Autodetect` is included because it is the app-level component that reads browser preferences
 * into the store; Playwright's `colorScheme` and `locale` options drive it.
 */
export const RealStoreStory = ({
    children,
    preloadedState,
}: PropsWithChildren<{ preloadedState?: DeepPartial<PreloadedState> }>) => {
    const store = useMemo(() => initStoreForTests(preloadedState).store, [preloadedState]);

    return (
        <Provider store={store}>
            <WithServices>
                <Autodetect />
                <ConnectedThemeProvider>
                    <ConnectedIntlProvider>
                        <MockedFormatterProvider>{children}</MockedFormatterProvider>
                    </ConnectedIntlProvider>
                </ConnectedThemeProvider>
            </WithServices>
        </Provider>
    );
};
