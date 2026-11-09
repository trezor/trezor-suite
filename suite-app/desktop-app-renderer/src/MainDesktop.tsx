/*
 Static import for polyfills. In createBaseConfig.ts, we use the useBuiltIns: 'entry' Babel setting, which determines
 which polyfills are picked as per the browserslist target.
*/
import 'core-js/actual';

import { useDebugLanguageShortcut } from '@suite/debug';
import { AppRouter, Main } from '@suite-app/app';
import {
    BioAuthGuard,
    ConnectedIntlProvider,
    FindBar,
    Metadata,
    Preloader,
    ToasterProvider,
    TrafficLightDraggableWindowHeader,
    useConnectPopupDesktop,
    useTor,
} from '@trezor/suite';

import { GlobalStyle } from './GlobalStyle';
import { DesktopUpdater } from './support/DesktopUpdater';
import { desktopComponents } from './support/desktopComponents';

export const MainDesktop = () => {
    useTor();
    useDebugLanguageShortcut();
    useConnectPopupDesktop();

    return (
        <Main trafficLightOffset={<TrafficLightDraggableWindowHeader />}>
            <GlobalStyle />
            <DesktopUpdater />
            <Metadata />
            <ToasterProvider />
            <BioAuthGuard>
                <Preloader>
                    <AppRouter components={desktopComponents} />
                    <ConnectedIntlProvider>
                        <FindBar />
                    </ConnectedIntlProvider>
                </Preloader>
            </BioAuthGuard>
        </Main>
    );
};
