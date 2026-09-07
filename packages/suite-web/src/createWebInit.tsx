import { Provider as ReduxProvider } from 'react-redux';

import { createRoot } from 'react-dom/client';

import { ServicesProvider } from '@suite-common/dependency-injection';

import { type HydrateReduxStoreDep } from 'src/reducers/createHydrateReduxStore';
import { type SuiteReduxStoreDep } from 'src/reducers/createReduxStore';
import { type SuiteServices } from 'src/support/createSuiteCompositionRoot';
import { preloadStore } from 'src/support/suite/preloadStore';
import { LoadingScreen } from 'src/support/suite/screens/LoadingScreen';

import { MainWeb } from './MainWeb';
import { initSentry } from './sentry';
import { logXssWarning } from './support/xssWarning';

type WebInitDeps = {
    services: SuiteServices & SuiteReduxStoreDep & HydrateReduxStoreDep;
};

export type WebInit = (container: HTMLElement) => Promise<void>;

export type WebInitDep = { webInit: WebInit };

export const createWebInit =
    (deps: WebInitDeps): WebInit =>
    async container => {
        logXssWarning();

        if (!window.Playwright) {
            initSentry();
        }

        // render simple loader with theme provider without redux, wait for indexedDB
        const root = createRoot(container);
        root.render(<LoadingScreen />);

        const preloadAction = await preloadStore();

        deps.services.hydrateReduxStore(preloadAction);

        root.render(
            <ServicesProvider services={deps.services}>
                <ReduxProvider store={deps.services.store}>
                    <MainWeb />
                </ReduxProvider>
            </ServicesProvider>,
        );
    };
