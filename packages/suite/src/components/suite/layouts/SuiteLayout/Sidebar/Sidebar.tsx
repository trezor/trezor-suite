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

const Container = styled.nav<{ $elevation: Elevation }>`
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    height: 100%;
    background: ${mapElevationToBackground};
    border-right: 1px solid ${mapElevationToBorder};
`;

const Wrapper = styled.div`
    display: flex;
`;

export const Sidebar = () => {
    const { elevation } = useElevation();

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
                <Container $elevation={elevation}>
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
