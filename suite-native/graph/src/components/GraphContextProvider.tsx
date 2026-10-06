import { type ReactNode } from 'react';

import { ServicesProvider } from '@suite-common/dependency-injection';
import { type NativeAnalyticsDep, analytics } from '@suite-native/analytics';
import { useActiveColorScheme } from '@suite-native/theme';
import { StylesProvider, createRenderer } from '@trezor/styles-native';
import { prepareNativeTheme } from '@trezor/theme';

type ProviderProps = {
    children: ReactNode;
};

const renderer = createRenderer();

/**
 * @deprecated This is a hack to go around the Skia `Canvas` limitation.
 *             See: https://github.com/trezor/trezor-suite/pull/25076
 *
 * So far only analytics are needed in the graph context. Might be extended later.
 */
const services: NativeAnalyticsDep = {
    analytics,
};

/**
 * @deprecated This is a hack to go around the Skia `Canvas` limitation.
 *             See: https://github.com/trezor/trezor-suite/pull/25076
 */
const GraphServicesProvider = ({ children }: ProviderProps) => (
    <ServicesProvider services={services}>{children}</ServicesProvider>
);

const GraphStylesProvider = ({ children }: ProviderProps) => {
    const colorVariant = useActiveColorScheme();
    const theme = prepareNativeTheme({ colorVariant });

    return (
        <StylesProvider theme={theme} renderer={renderer}>
            {children}
        </StylesProvider>
    );
};

// Since react native skia `Canvas` is using its own renderer, the  React Native context
// is not available directly. This component re-injects the needed context providers.
// read more: https://shopify.github.io/react-native-skia/docs/canvas/contexts
export const GraphContextProvider = ({ children }: ProviderProps) => (
    <GraphServicesProvider>
        {/* StylesProvider needs access to the ServicesProvider */}
        <GraphStylesProvider>{children}</GraphStylesProvider>
    </GraphServicesProvider>
);
