import 'core-js/actual';

import { Suspense } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { createBrowserHistory } from 'history';
import { createRoot } from 'react-dom/client';

import {
    AppRouter,
    BundleLoader,
    Metadata,
    Preloader,
    ToasterProvider,
} from 'src/components/suite';
import { useDebugLanguageShortcut } from 'src/hooks/suite';
import { initStore } from 'src/reducers/store';
import { SuiteServicesProvider } from 'src/support/SuiteServicesProvider';
import { Main } from 'src/support/suite/Main';
import { preloadStore } from 'src/support/suite/preloadStore';
import { LoadingScreen } from 'src/support/suite/screens/LoadingScreen';
import { useConnectPopupWeb } from 'src/support/suite/useConnectPopupWeb';
import { useTor } from 'src/support/suite/useTor';

import { initSentry } from './sentry';
import { usePlaywright } from './support/usePlaywright';
import { webComponents } from './support/webComponents';

const MainWeb = () => {
    usePlaywright();
    useTor();
    useDebugLanguageShortcut();
    useConnectPopupWeb();

    return (
        <Main>
            <Metadata />
            <ToasterProvider />
            <Preloader>
                <Suspense fallback={<BundleLoader />}>
                    <AppRouter components={webComponents} />
                </Suspense>
            </Preloader>
        </Main>
    );
};

export const init = async (container: HTMLElement) => {
    if (!window.Playwright) {
        initSentry();
    }

    // render simple loader with theme provider without redux, wait for indexedDB
    const root = createRoot(container);
    root.render(<LoadingScreen />);

    const preloadAction = await preloadStore();
    const { store, services } = initStore({ history: createBrowserHistory() }, preloadAction);

    root.render(
        <SuiteServicesProvider services={services}>
            <ReduxProvider store={store}>
                <MainWeb />
            </ReduxProvider>
        </SuiteServicesProvider>,
    );
};
