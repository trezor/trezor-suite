import React, { useState } from 'react';

import { AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

import { selectDevicesCount, selectSelectedDevice } from '@suite-common/wallet-core';
import { Box, ElevationUp, ResizableBox, useElevation } from '@trezor/components';
import { TrezorLogo } from '@trezor/product-components';
import {
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
    zIndices,
} from '@trezor/theme';

import { setSidebarWidth as setSidebarWidthInRedux } from 'src/actions/suite/suiteActions';
import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectShouldDisplayDeviceCompromised } from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

import { Navigation } from './Navigation';
import { QuickActions } from './QuickActions/QuickActions';
import { TrafficLightOffset } from '../../../TrafficLightOffset';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { UpdateNotificationBanner } from './QuickActions/Update/UpdateNotificationBanner';
import { useUpdateStatus } from './QuickActions/Update/useUpdateStatus';

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
    flex-direction: column;
`;
const Content = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
`;

const HorizontalSpacer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    z-index: ${zIndices.expandableNavigationHeader};
    overflow: auto;
    gap: ${spacingsPx.sm};
`;

export const SIDEBAR_MIN_WIDTH = 84;

type SidebarProps = {
    showAccounts?: boolean;
};

export const Sidebar = ({ showAccounts = true }: SidebarProps) => {
    const [closedNotificationDevice, setClosedNotificationDevice] = useState(false);
    const [closedNotificationSuite, setClosedNotificationSuite] = useState(false);
    const [isBannerVisible, setIsBannerVisible] = useState(true);
    const { isSidebarCollapsed, setSidebarWidth, sidebarWidth } = useResponsiveContext();
    const dispatch = useDispatch();

    const { elevation } = useElevation();
    const { updateStatusDevice, updateStatusSuite } = useUpdateStatus();

    const shouldDisplayDeviceCompromised = useSelector(selectShouldDisplayDeviceCompromised);
    const selectedDevice = useSelector(selectSelectedDevice);
    const devicesCount = useSelector(selectDevicesCount);

    const handleSidebarWidthChanged = (width: number) => {
        setSidebarWidth(width);
        dispatch(setSidebarWidthInRedux({ width }));
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

    const showAccountsAndIsDeviceReady =
        !shouldDisplayDeviceCompromised &&
        selectedDevice !== undefined &&
        selectedDevice.mode === 'normal' && // not bootloader, etc...
        showAccounts;

    return (
        <Wrapper>
            <ResizableBox
                directions={['right']}
                width={sidebarWidth}
                minWidth={SIDEBAR_MIN_WIDTH}
                maxWidth={600}
                zIndex={zIndices.draggableComponent}
                onWidthResizeEnd={handleSidebarWidthChanged}
                onWidthResizeMove={handleSidebarWidthUpdate}
                disabledWidthInterval={[84, 240]}
                flex="1"
            >
                <Container $elevation={elevation}>
                    <TrafficLightOffset>
                        <Content>
                            {devicesCount > 0 ? (
                                <DeviceSelector />
                            ) : (
                                <Box margin={{ left: 20, right: 12, top: 12, bottom: 12 }}>
                                    <TrezorLogo width="107px" type="horizontal" />
                                </Box>
                            )}
                            <ElevationUp>
                                <Navigation />
                            </ElevationUp>
                            <HorizontalSpacer>
                                {showAccountsAndIsDeviceReady && <AccountsMenu />}
                            </HorizontalSpacer>
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
