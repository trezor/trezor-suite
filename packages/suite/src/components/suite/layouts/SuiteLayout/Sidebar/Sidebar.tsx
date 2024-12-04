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
    const [closedNotificationDevice, setClosedNotificationDevice] = useState(false);
    const [closedNotificationSuite, setClosedNotificationSuite] = useState(false);
    const { isSidebarCollapsed } = useResponsiveContext();

    const { elevation } = useElevation();
    const { updateStatusDevice, updateStatusSuite } = useUpdateStatus();

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
                <Container $elevation={elevation}>
                    <ElevationUp>
                        <TrafficLightOffset>
                            <Content>
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
