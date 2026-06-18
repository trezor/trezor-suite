import 'core-js/actual';

import { Suspense } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { createRoot } from 'react-dom/client';

import { useDebugLanguageShortcut } from '@suite/debug';
import { ServicesProvider } from '@suite-common/dependency-injection';

import {
    AppRouter,
    BundleLoader,
    Metadata,
    Preloader,
    ToasterProvider,
} from 'src/components/suite';
import { Main } from 'src/support/suite/Main';
import { preloadStore } from 'src/support/suite/preloadStore';
import { LoadingScreen } from 'src/support/suite/screens/LoadingScreen';
import { useConnectPopupWeb } from 'src/support/suite/useConnectPopupWeb';
import { useConnectPopupWebextension } from 'src/support/suite/useConnectPopupWebextension';
import { useTor } from 'src/support/suite/useTor';

import { createSuiteWebCompositionRoot } from './createSuiteWebCompositionRoot';
import { initSentry, initSentryE2E } from './sentry';
import { usePlaywright } from './support/usePlaywright';
import { webComponents } from './support/webComponents';

const MainWeb = () => {
    usePlaywright();
    useTor();
    useDebugLanguageShortcut();
    useConnectPopupWeb();
    useConnectPopupWebextension();

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
    if (window.__SENTRY_E2E_PROFILING__) {
        // Playwright e2e profiling run: init Sentry with the dedicated e2e config and expose
        // window.uiProfiler for the harness to drive. See suite/sentry SENTRY_E2E_CONFIG.
        initSentryE2E();
    } else if (!window.Playwright) {
        initSentry();
    }

    // render simple loader with theme provider without redux, wait for indexedDB
    const root = createRoot(container);
    root.render(<LoadingScreen />);

    const preloadAction = await preloadStore();

    const { store, services } = createSuiteWebCompositionRoot(preloadAction);

    root.render(
        <ServicesProvider services={services}>
            <ReduxProvider store={store}>
                <MainWeb />
            </ReduxProvider>
        </ServicesProvider>,
    );
};
