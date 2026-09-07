import { useDebugLanguageShortcut } from '@suite/debug';

import {
    AppRouter,
    Preloader,
    ToasterProvider,
    TrafficLightDraggableWindowHeader,
} from 'src/components/suite';
import { BioAuthGuard } from 'src/components/suite/BioAuthGuard/BioAuthGuard';
import { FindBar } from 'src/components/suite/FindBar/FindBar';
import { Metadata } from 'src/components/suite/Metadata';
import { ConnectedIntlProvider } from 'src/support/suite/ConnectedIntlProvider';
import { Main } from 'src/support/suite/Main';
import { useConnectPopupDesktop } from 'src/support/suite/useConnectPopupDesktop';
import { useTor } from 'src/support/suite/useTor';

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
