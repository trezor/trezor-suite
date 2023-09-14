import { createRoot } from 'react-dom/client';
import { Provider as ReduxProvider } from 'react-redux';
import { Router as RouterProvider } from 'react-router-dom';
import { init as initSentry } from '@sentry/browser';

import { initStore } from 'src/reducers/store';
import { preloadStore } from 'src/support/suite/preloadStore';
import { SENTRY_CONFIG } from '@suite-common/sentry';

import Preloader from 'src/components/suite/Preloader';
import { Metadata, ToastContainer } from 'src/components/suite';
import { ConnectedIntlProvider } from 'src/support/suite/ConnectedIntlProvider';
import Resize from 'src/support/suite/Resize';
import Protocol from 'src/support/suite/Protocol';
import Autodetect from 'src/support/suite/Autodetect';
import { useTor } from 'src/support/suite/useTor';
import OnlineStatus from 'src/support/suite/OnlineStatus';
import ErrorBoundary from 'src/support/suite/ErrorBoundary';
import RouterHandler from 'src/support/suite/Router';
import { ConnectedThemeProvider } from 'src/support/suite/ConnectedThemeProvider';
import { LoadingScreen } from 'src/support/suite/screens/LoadingScreen';
import { useFormattersConfig } from 'src/hooks/suite';
import history from 'src/support/history';
import { ModalContextProvider } from 'src/support/suite/ModalContext';

import AppRouter from './support/Router';
import { useCypress } from './support/useCypress';
import { FormatterProvider } from '@suite-common/formatters';

const Main = () => {
    useCypress();
    useTor();
    const formattersConfig = useFormattersConfig();

    return (
        <ConnectedThemeProvider>
            <RouterProvider history={history}>
                <ModalContextProvider>
                    <ErrorBoundary>
                        <Autodetect />
                        <Resize />
                        <Protocol />
                        <OnlineStatus />
                        <RouterHandler />
                        <ConnectedIntlProvider>
                            <FormatterProvider config={formattersConfig}>
                                <Metadata />
                                <ToastContainer />
                                <Preloader>
                                    <AppRouter />
                                </Preloader>
                            </FormatterProvider>
                        </ConnectedIntlProvider>
                    </ErrorBoundary>
                </ModalContextProvider>
            </RouterProvider>
        </ConnectedThemeProvider>
    );
};

export const init = async (container: HTMLElement) => {
    if (!window.Cypress) {
        initSentry(SENTRY_CONFIG);
    }

    // render simple loader with theme provider without redux, wait for indexedDB
    const root = createRoot(container);
    root.render(<LoadingScreen />);

    const preloadAction = await preloadStore();
    const store = initStore(preloadAction);

    root.render(
        <ReduxProvider store={store}>
            <Main />
        </ReduxProvider>,
    );
};
