import { Provider as ReduxProvider } from 'react-redux';

import { createRoot } from 'react-dom/client';

import { ServicesProvider } from '@suite-common/dependency-injection';
import TrezorConnect from '@trezor/connect-electron';
import { type DesktopApi } from '@trezor/suite-desktop-api';

import { initBluetoothThunk } from 'src/actions/bluetooth/initBluetoothThunk';
import * as STORAGE from 'src/actions/suite/constants/storageConstants';
import { desktopHandshake } from 'src/actions/suite/suiteActions';
import { type HydrateReduxStoreDep } from 'src/reducers/createHydrateReduxStore';
import { type SuiteReduxStoreDep } from 'src/reducers/createReduxStore';
import { type SuiteServices } from 'src/support/createSuiteCompositionRoot';
import { ConnectedIntlProvider } from 'src/support/suite/ConnectedIntlProvider';
import { ErrorScreen } from 'src/support/suite/screens/ErrorScreen';
import { LoadingScreen } from 'src/support/suite/screens/LoadingScreen';

import { MainDesktop } from './MainDesktop';
import { initSentry } from './sentry';
import { TorLoadingScreen } from './support/screens/TorLoadingScreen';

type DesktopAppDeps = {
    desktopApi: DesktopApi;
    services: SuiteServices & SuiteReduxStoreDep & HydrateReduxStoreDep;
};

export type DesktopApp = (container: HTMLElement) => Promise<void>;

export type DesktopAppDep = { desktopApp: DesktopApp };

export const createDesktopApp =
    (deps: DesktopAppDeps): DesktopApp =>
    async container => {
        initSentry();

        // render simple loader with theme provider without redux, wait for indexedDB
        const root = createRoot(container);
        root.render(<LoadingScreen />);

        const preloadAction = await deps.services.hydrateReduxStore();

        // Expose Redux store for Playwright/e2e tests
        if (typeof window !== 'undefined' && window.desktopFlags?.exposeStore) {
            (window as any).store = deps.services.store;
        }

        // start logging to file if Debug menu is active
        if (preloadAction?.type === STORAGE.LOAD && preloadAction.payload.debug?.showDebugMenu) {
            deps.desktopApi.configLogger({
                level: 'debug',
                writeToDisk: true,
            });
        }

        // Loading Tor as separate module, before the rest of the modules.
        const { shouldRunTor } = await deps.desktopApi.loadTorModule();

        // When we run this first time `shouldRunTor` will tell if Tor should run according to previous settings,
        // when it runs because of renderer (e.g. Ctrl+R) it will always be false.
        if (shouldRunTor) {
            await new Promise(resolve => {
                root.render(
                    <ServicesProvider services={deps.services}>
                        <ReduxProvider store={deps.services.store}>
                            <ConnectedIntlProvider>
                                <TorLoadingScreen callback={resolve} />
                            </ConnectedIntlProvider>
                        </ReduxProvider>
                    </ServicesProvider>,
                );
                deps.desktopApi.toggleTor(true);
            });
        }

        const loadModules = await deps.desktopApi.loadModules({
            legacyBioAuthEnabled: deps.services.store.getState()?.bioAuth?.bioAuthEnabled,
        });
        if (!loadModules.success) {
            // loading failed, render error with theme provider without redux and do not continue
            root.render(
                <ServicesProvider services={deps.services}>
                    <ErrorScreen error={loadModules.error} />
                </ServicesProvider>,
            );

            return;
        }

        deps.services.store.dispatch(desktopHandshake(loadModules.payload));

        // establish ipc connection with TrezorConnect living in main process
        await TrezorConnect.initIpcProxy();

        // init bluetooth module
        // TODO should it really be here instead of initAction.ts?
        await deps.services.store.dispatch(initBluetoothThunk());

        // finally render whole app
        root.render(
            <ServicesProvider services={deps.services}>
                <ReduxProvider store={deps.services.store}>
                    <MainDesktop />
                </ReduxProvider>
            </ServicesProvider>,
        );
    };
