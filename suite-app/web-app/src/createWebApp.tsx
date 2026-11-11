import { Provider as ReduxProvider } from 'react-redux';

import { createRoot } from 'react-dom/client';

import {
    type HydrateReduxStoreDep,
    type ReduxLoggerControlDep,
    type SuiteReduxStoreDep,
    type SuiteServices,
} from '@suite-app/app';
import { ServicesProvider } from '@trezor/dependency-injection';
import { LoadingScreen } from '@trezor/suite';

import { MainWeb } from './MainWeb';
import { initSentry } from './sentry';
import { logXssWarning } from './support/xssWarning';

type WebAppDeps = {
    services: SuiteServices & SuiteReduxStoreDep & HydrateReduxStoreDep & ReduxLoggerControlDep;
};

export type WebApp = (container: HTMLElement) => Promise<void>;

export type WebAppDep = { webApp: WebApp };

export const createWebApp =
    (deps: WebAppDeps): WebApp =>
    async container => {
        logXssWarning();

        if (!window.Playwright) {
            initSentry();
        }

        // render simple loader with theme provider without redux, wait for indexedDB
        const root = createRoot(container);
        root.render(<LoadingScreen />);

        await deps.services.hydrateReduxStore();

        deps.services.networks.loadNetworkModules();
        deps.services.staking.loadStakingProducts();

        root.render(
            <ServicesProvider services={deps.services}>
                <ReduxProvider store={deps.services.store}>
                    <MainWeb />
                </ReduxProvider>
            </ServicesProvider>,
        );
    };
