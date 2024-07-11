import React from 'react';
import styled from 'styled-components';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { Navigation } from './Navigation';
import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { QuickActions } from './QuickActions';
import { ElevationUp, ResizableBox, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBackground, mapElevationToBorder, zIndices } from '@trezor/theme';
import { useActions, useSelector } from 'src/hooks/suite';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { isDesktop, isMacOs } from '@trezor/env-utils';

const Container = styled.nav<{ $elevation: Elevation; $hasTopPadding?: boolean }>`
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    height: 100%;
    background: ${mapElevationToBackground};
    border-right: 1px solid ${mapElevationToBorder};
    ${
        ({ $hasTopPadding }) => $hasTopPadding && 'padding-top: 35px;' // on Mac in desktop app we don't use window bar and close/maximize/minimize icons are positioned in the app
    }
`;

const Wrapper = styled.div`
    display: flex;
`;

export const Sidebar = () => {
    const { elevation } = useElevation();
    const isMac = isMacOs();
    const isDesktopApp = isDesktop();

    const sidebarWidth = useSelector(state => state.suite.settings.sidebarWidth);
    const { setSidebarWidth } = useActions({
        setSidebarWidth: (width: number) => suiteActions.setSidebarWidth({ width }),
    });

    return (
        <Wrapper>
            <ResizableBox
                directions={['right']}
                width={sidebarWidth}
                minWidth={230}
                maxWidth={400}
                zIndex={zIndices.draggableComponent}
                updateHeightOnWindowResize
                onWidthResizeEnd={setSidebarWidth}
            >
                <Container $elevation={elevation} $hasTopPadding={isMac && isDesktopApp}>
                    <ElevationUp>
                        <DeviceSelector />
                        <Navigation />
                        <AccountsMenu />
                        <QuickActions />
                    </ElevationUp>
                </Container>
            </ResizableBox>
        </Wrapper>
    );
};
