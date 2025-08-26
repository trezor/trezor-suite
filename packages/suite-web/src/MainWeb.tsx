import { Suspense } from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { init as initSentry } from '@sentry/browser';
import { type History, createBrowserHistory } from 'history';
import { createRoot } from 'react-dom/client';

import { SENTRY_CONFIG } from '@suite-common/sentry';

import { AppRouter, BundleLoader, Metadata, Preloader, ToastContainer } from 'src/components/suite';
import { useDebugLanguageShortcut } from 'src/hooks/suite';
import { initStore } from 'src/reducers/store';
import { createRouterServices } from 'src/support/extraDependencies';
import { Main } from 'src/support/suite/Main';
import { preloadStore } from 'src/support/suite/preloadStore';
import { LoadingScreen } from 'src/support/suite/screens/LoadingScreen';
import { useTor } from 'src/support/suite/useTor';

import { usePlaywright } from './support/usePlaywright';
import { webComponents } from './support/webComponents';

const MainWeb = ({ history }: { history: History }) => {
    usePlaywright();
    useTor();
    useDebugLanguageShortcut();

    return (
        <Main history={history}>
            <Metadata />
            <ToastContainer />
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
        initSentry(SENTRY_CONFIG);
    }

    const browserHistory = createBrowserHistory();

    // render simple loader with theme provider without redux, wait for indexedDB
    const root = createRoot(container);
    root.render(<LoadingScreen />);

    const preloadAction = await preloadStore();
    const store = initStore(preloadAction, {
        additionalExtraDeps: {
            routerServices: createRouterServices(browserHistory),
        },
    });

    root.render(
        <ReduxProvider store={store}>
            <MainWeb history={browserHistory} />
        </ReduxProvider>,
    );
};
