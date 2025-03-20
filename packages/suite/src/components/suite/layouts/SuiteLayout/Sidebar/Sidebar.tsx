import React, { useState } from 'react';

import { AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

import { ElevationUp, ResizableBox, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBackground, mapElevationToBorder, zIndices } from '@trezor/theme';

import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { useActions } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

import { Navigation } from './Navigation';
import { QuickActions } from './QuickActions/QuickActions';
import { TrafficLightOffset } from '../../../TrafficLightOffset';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { UpdateNotificationBanner } from './QuickActions/Update/UpdateNotificationBanner';
import { useUpdateStatus } from './QuickActions/Update/useUpdateStatus';
import { setSidebarWidth as setSidebarWidthInRedux } from '../../../../../actions/suite/suiteActions';

const Container = styled.nav<{ $elevation: Elevation }>`
    overflow-x: hidden;
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

export const SIDEBAR_MIN_WIDTH = 84;

export const Sidebar = () => {
    const [closedNotificationDevice, setClosedNotificationDevice] = useState(false);
    const [closedNotificationSuite, setClosedNotificationSuite] = useState(false);
    const [isBannerVisible, setIsBannerVisible] = useState(true);
    const { isSidebarCollapsed, setSidebarWidth, sidebarWidth } = useResponsiveContext();

    const { elevation } = useElevation();
    const { updateStatusDevice, updateStatusSuite } = useUpdateStatus();

    const actions = useActions({
        setSidebarWidth: (width: number) => setSidebarWidthInRedux({ width }),
    });

    const handleSidebarWidthChanged = (width: number) => {
        setSidebarWidth(width);
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
                minWidth={SIDEBAR_MIN_WIDTH}
                maxWidth={600}
                zIndex={zIndices.draggableComponent}
                updateHeightOnWindowResize
                onWidthResizeEnd={handleSidebarWidthChanged}
                onWidthResizeMove={handleSidebarWidthUpdate}
                disabledWidthInterval={[84, 240]}
            >
                <Container $elevation={elevation}>
                    <TrafficLightOffset>
                        <Content>
                            <DeviceSelector />
                            <ElevationUp>
                                <Navigation />
                            </ElevationUp>
                            <AccountsMenu />
                            <AnimatePresence onExitComplete={onNotificationBannerClosed}>
                                {showUpdateBannerNotification &&
                                    !isSidebarCollapsed &&
                                    isBannerVisible && (
                                        <UpdateNotificationBanner
                                            updateStatusDevice={updateStatusDevice}
                                            updateStatusSuite={updateStatusSuite}
                                            onClose={() => setIsBannerVisible(false)}
                                        />
                                    )}
                            </AnimatePresence>
                            <QuickActions
                                isSidebarCollapsed={isSidebarCollapsed}
                                showUpdateBannerNotification={showUpdateBannerNotification}
                            />
                        </Content>
                    </TrafficLightOffset>
                </Container>
            </ResizableBox>
        </Wrapper>
    );
};
