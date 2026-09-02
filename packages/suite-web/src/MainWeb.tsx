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
import { initSentry } from './sentry';
import { usePlaywright } from './support/usePlaywright';
import { webComponents } from './support/webComponents';
import { logXssWarning } from './support/xssWarning';

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
    logXssWarning();

    if (!window.Playwright) {
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
