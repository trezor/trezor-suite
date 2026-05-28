import { type ReactNode, useMemo } from 'react';
import { Provider } from 'react-redux';

import { useFormattersConfig } from '@suite-native/formatters-config';
import { BasicProviderForTests } from '@suite-native/test-utils';

import { type TestStore } from './StoreProviderForTests';
import { createStoreFromPreloadedState } from './createStoreFromPreloadedState';

type Props = {
    children: ReactNode;
    preloadedState?: Record<string, unknown>;
    injectedStore?: TestStore;
    services?: Record<string, unknown>;
};

const BasicProviderWithFormattingConfig = ({
    children,
    services,
}: {
    children: ReactNode;
    services?: Record<string, unknown>;
}) => {
    const formattersConfig = useFormattersConfig();

    return (
        <BasicProviderForTests
            formattersConfig={formattersConfig}
            services={services}
            omitNavigationContainer
        >
            {children}
        </BasicProviderForTests>
    );
};

/*
Like `StoreProviderForTests`, but skips the `NavigationContainer` wrapper so the tree can be passed
to `expo-router/testing-library`'s `renderRouter` as a `wrapper`. expo-router supplies its own
navigation container; nesting another one triggers a "linking configured in multiple places" error.

TODO: extract a `renderRouterWithStoreProvider(context, options)` helper alongside this provider.
Every expo-router test currently has to repeat the same three workarounds:
  1. pass `linking: { enabled: false }` to silence the multi-linking warning from expo-router internals
  2. `act(() => jest.runAllTimers())` after render so navigation effects settle synchronously
  3. `afterEach(() => jest.useRealTimers())` because `renderRouter` flips on fake timers and the
     auto-`cleanup()` from `@testing-library/react-native` will otherwise hang for 5s and fail the test
See `suite-native/app/src/navigation/__tests__/AppTabsLayout.test.tsx` for the current pattern.

Important: expo-router tests MUST live outside the `src/app/` directory. expo-router uses
`require.context` to scan that tree and pulls every file into the native bundle, including
test files that import `expo-router/testing-library` — which depends on Node's `path` module
and crashes the React Native bundler.
 */
export const StoreProviderForExpoRouterTests = ({
    children,
    injectedStore,
    preloadedState,
    services,
}: Props) => {
    const store = useMemo(
        () => injectedStore ?? createStoreFromPreloadedState(preloadedState),
        [injectedStore, preloadedState],
    );

    return (
        <Provider store={store}>
            <BasicProviderWithFormattingConfig services={services}>
                {children}
            </BasicProviderWithFormattingConfig>
        </Provider>
    );
};
