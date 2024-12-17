import React, { useState } from 'react';

import styled from 'styled-components';

import { ElevationUp, ResizableBox, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBackground, mapElevationToBorder, zIndices } from '@trezor/theme';

import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { useActions } from 'src/hooks/suite';

import { QuickActions } from './QuickActions/QuickActions';
import { Navigation } from './Navigation';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { TrafficLightOffset } from '../../../TrafficLightOffset';
import { UpdateNotificationBanner } from './QuickActions/Update/UpdateNotificationBanner';
import { useUpdateStatus } from './QuickActions/Update/useUpdateStatus';
import { setSidebarWidth as setSidebarWidthInRedux } from '../../../../../actions/suite/suiteActions';
import { useResponsiveContext } from '../../../../../support/suite/ResponsiveContext';

const Container = styled.nav<{ $elevation: Elevation; $isSidebarDragged: boolean }>`
    display: flex;
    container-type: inline-size;
    flex-direction: column;
    flex: 0 0 auto;
    height: 100%;
    background: ${mapElevationToBackground};
    border-right: 1px solid ${mapElevationToBorder};
    ${({ $isSidebarDragged }) =>
        $isSidebarDragged
            ? `
    filter: blur(10px);
    transition: filter 0.1s;`
            : ''}
`;

const Wrapper = styled.div`
    display: flex;
`;
const Content = styled.div<{ $isSidebarCollapsed: number }>`
    height: 100%;
    display: flex;
    flex-direction: column;
    ${({ $isSidebarCollapsed }) => $isSidebarCollapsed && `max-width: 84px`};
`;

export const Sidebar = () => {
    const [closedNotificationDevice, setClosedNotificationDevice] = useState(false);
    const [closedNotificationSuite, setClosedNotificationSuite] = useState(false);
    const { isSidebarCollapsed, setSidebarWidth, sidebarWidth } = useResponsiveContext();

    const [isSidebarDragged, setIsSidebarDragged] = useState(false);

    const { elevation } = useElevation();
    const { updateStatusDevice, updateStatusSuite } = useUpdateStatus();

    const actions = useActions({
        setSidebarWidth: (width: number) => setSidebarWidthInRedux({ width }),
    });

    const handleSidebarWidthChanged = (width: number) => {
        setSidebarWidth(width);
        actions.setSidebarWidth(width);
        setIsSidebarDragged(false);
    };
    const handleSidebarWidthUpdate = (width: number) => {
        setSidebarWidth(width);
        setIsSidebarDragged(true);
    };

    const onNotificationBannerClosed = () => {
        if (updateStatusSuite !== 'up-to-date') {
            setClosedNotificationSuite(true);
        }
        if (updateStatusDevice !== 'up-to-date') {
            setClosedNotificationDevice(true);
        }
    };

    const showUpdateBannerNotification =
        (updateStatusSuite !== 'up-to-date' && !closedNotificationSuite) ||
        (!['up-to-date', 'disconnected'].includes(updateStatusDevice) && !closedNotificationDevice);

    return (
        <Wrapper>
            <ResizableBox
                directions={['right']}
                width={sidebarWidth}
                minWidth={84}
                maxWidth={600}
                zIndex={zIndices.draggableComponent}
                updateHeightOnWindowResize
                onWidthResizeEnd={handleSidebarWidthChanged}
                onWidthResizeMove={handleSidebarWidthUpdate}
                disabledWidthInterval={[84, 240]}
            >
                <Container $elevation={elevation} $isSidebarDragged={isSidebarDragged}>
                    <ElevationUp>
                        <TrafficLightOffset>
                            <Content $isSidebarCollapsed={isSidebarCollapsed}>
                                <DeviceSelector />
                                <Navigation />
                                <AccountsMenu />

                                {showUpdateBannerNotification && !isSidebarCollapsed && (
                                    <UpdateNotificationBanner
                                        updateStatusDevice={updateStatusDevice}
                                        updateStatusSuite={updateStatusSuite}
                                        onClose={onNotificationBannerClosed}
                                    />
                                )}

                                <QuickActions
                                    showUpdateBannerNotification={showUpdateBannerNotification}
                                />
                            </Content>
                        </TrafficLightOffset>
                    </ElevationUp>
                </Container>
            </ResizableBox>
        </Wrapper>
    );
};
