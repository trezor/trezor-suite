import { HelmetProvider } from 'react-helmet-async';

import { FormatterProvider } from '@suite-common/formatters';
import { SelectCacheProvider } from '@trezor/components';

import { useFormattersConfig } from 'src/hooks/suite';
import Autodetect from 'src/support/suite/Autodetect';
import { ConnectedIntlProvider } from 'src/support/suite/ConnectedIntlProvider';
import { ConnectedThemeProvider } from 'src/support/suite/ConnectedThemeProvider';
import { ErrorBoundary } from 'src/support/suite/ErrorBoundary';
import OnlineStatus from 'src/support/suite/OnlineStatus';
import Protocol from 'src/support/suite/Protocol';
import Resize from 'src/support/suite/Resize';
import { ResponsiveContextProvider } from 'src/support/suite/ResponsiveContext';

import { DesktopReactQueryProvider } from './DesktopReactQueryProvider';
import { RouterHandler } from './RouterHandler';
import { useConnectPopupModals } from './useConnectPopupModals';

export const Main = ({
    trafficLightOffset,
    children,
}: {
    trafficLightOffset?: React.ReactNode;
    children: React.ReactNode;
}) => {
    useConnectPopupModals();
    const formattersConfig = useFormattersConfig();

    return (
        // Todo: Enable when issues are fixed (ReactTruncate & BumpFee)
        // <StrictMode>
        <HelmetProvider>
            {trafficLightOffset ?? null}
            <ConnectedThemeProvider>
                <ResponsiveContextProvider>
                    <ErrorBoundary>
                        <DesktopReactQueryProvider>
                            <Autodetect />
                            <Resize />
                            <Protocol />
                            <OnlineStatus />
                            <RouterHandler />
                            <ConnectedIntlProvider>
                                <SelectCacheProvider>
                                    <FormatterProvider config={formattersConfig}>
                                        {children}
                                    </FormatterProvider>
                                </SelectCacheProvider>
                            </ConnectedIntlProvider>
                        </DesktopReactQueryProvider>
                    </ErrorBoundary>
                </ResponsiveContextProvider>
            </ConnectedThemeProvider>
        </HelmetProvider>
        // </StrictMode>
    );
};
