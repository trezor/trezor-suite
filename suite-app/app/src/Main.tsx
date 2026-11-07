import { injectQueryClient } from '@suite-common/react-query';
import { ReactQueryProvider } from '@suite-common/react-query/react';
import { SelectCacheProvider } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import {
    Autodetect,
    ConnectPopupModals,
    ConnectedFormatterProvider,
    ConnectedIntlProvider,
    ConnectedThemeProvider,
    ErrorBoundary,
    OnlineStatus,
    Protocol,
    Resize,
    ResponsiveContextProvider,
} from '@trezor/suite';

import { RouterHandler } from './RouterHandler';

type MainProps = {
    trafficLightOffset?: React.ReactNode;
    children: React.ReactNode;
};

export const Main = ({ trafficLightOffset, children }: MainProps) => {
    const { queryClient } = useServices(injectQueryClient);

    return (
        // Todo: Enable when issues are fixed (ReactTruncate & BumpFee)
        // <StrictMode>
        <>
            {trafficLightOffset ?? null}
            <ConnectPopupModals />
            <ConnectedThemeProvider>
                <ResponsiveContextProvider>
                    <ErrorBoundary>
                        <ReactQueryProvider client={queryClient}>
                            <Autodetect />
                            <Resize />
                            <Protocol />
                            <OnlineStatus />
                            <RouterHandler />
                            <ConnectedIntlProvider>
                                <SelectCacheProvider>
                                    <ConnectedFormatterProvider>
                                        {children}
                                    </ConnectedFormatterProvider>
                                </SelectCacheProvider>
                            </ConnectedIntlProvider>
                        </ReactQueryProvider>
                    </ErrorBoundary>
                </ResponsiveContextProvider>
            </ConnectedThemeProvider>
        </>
        // </StrictMode>
    );
};
