import React from 'react';
import styled from 'styled-components';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { Navigation } from './Navigation';
import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { QuickActions } from './QuickActions/QuickActions';
import { ElevationUp, ResizableBox, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBackground, mapElevationToBorder, zIndices } from '@trezor/theme';
import { useActions, useSelector } from 'src/hooks/suite';
import { TrafficLightOffset } from '../../../TrafficLightOffset';
import { setSidebarWidth as setSidebarWidthInRedux } from '../../../../../actions/suite/suiteActions';
import { useResponsiveContext } from '../../../../../support/suite/ResponsiveContext';

const Container = styled.nav<{ $elevation: Elevation }>`
    display: flex;
    container-type: inline-size;
    flex-direction: column;
    flex: 0 0 auto;
    height: 100%;
    background: ${mapElevationToBackground};
    border-right: 1px solid ${mapElevationToBorder};
`;

const Wrapper = styled.div`
    display: flex;
`;
const Content = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
`;

export const Sidebar = () => {
    const { elevation } = useElevation();

    const sidebarWidthFromRedux = useSelector(state => state.suite.settings.sidebarWidth);

    const actions = useActions({
        setSidebarWidth: (width: number) => setSidebarWidthInRedux({ width }),
    });

    const { setSidebarWidth, sidebarWidth } = useResponsiveContext();

    const handleSidebarWidthChanged = (width: number) => {
        actions.setSidebarWidth(width);
    };
    const handleSidebarWidthUpdate = (width: number) => {
        setSidebarWidth(width);
    };

    return (
        <Wrapper>
            <ResizableBox
                directions={['right']}
                width={sidebarWidth || sidebarWidthFromRedux}
                minWidth={84}
                maxWidth={600}
                zIndex={zIndices.draggableComponent}
                updateHeightOnWindowResize
                onWidthResizeEnd={handleSidebarWidthChanged}
                onWidthResizeMove={handleSidebarWidthUpdate}
                disabledWidthInterval={[84, 240]}
            >
                <Container $elevation={elevation}>
                    <ElevationUp>
                        <TrafficLightOffset>
                            <Content>
                                <DeviceSelector />
                                <Navigation />
                                <AccountsMenu />
                                <QuickActions />
                            </Content>
                        </TrafficLightOffset>
                    </ElevationUp>
                </Container>
            </ResizableBox>
        </Wrapper>
    );
};
