import React, { useEffect, useState } from 'react';

import { AnimatePresence } from 'framer-motion';
import styled from 'styled-components';

import { suiteSettingsActions } from '@suite/settings';
import { selectDevicesCount, selectSelectedDevice } from '@suite-common/device';
import { Box, ElevationUp, Icon, ResizableBox, useElevation } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { TrezorLogo } from '@trezor/product-components';
import {
    type Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
    zIndices,
} from '@trezor/theme';

import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectShouldDisplayDeviceCompromised } from 'src/selectors/suite/suiteAuthenticityChecksSelectors';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

import { Navigation } from './Navigation';
import { QuickActions } from './QuickActions/QuickActions';
import { UpdateNotificationBanner } from './QuickActions/Update/UpdateNotificationBanner';
import { useUpdateStatus } from './QuickActions/Update/useUpdateStatus';
import {
    SIDEBAR_AUTO_COLLAPSE_BREAKPOINT,
    SIDEBAR_COLLAPSED_WIDTH,
    SIDEBAR_MAX_WIDTH,
    SIDEBAR_MIN_WIDTH,
} from './consts';
import { TrafficLightOffset } from '../../../TrafficLightOffset';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';

const Container = styled.nav<{ $elevation: Elevation }>`
    overflow-x: hidden;
    display: flex;
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

type WalletSwitcherProps = {
    isCollapsed: boolean;
};

const WalletSwitcher = ({ isCollapsed }: WalletSwitcherProps) => {
    const devicesCount = useSelector(selectDevicesCount);

    if (devicesCount > 0) {
        return <DeviceSelector />;
    }

    return isCollapsed ? (
        <Box margin={{ left: 'auto', right: 'auto', top: isDesktop() ? 24 : 12, bottom: 12 }}>
            <Icon name="trezorLogo" size={24} pointerEvents="none" />
        </Box>
    ) : (
        <Box margin={{ left: 20, right: 12, top: isDesktop() ? 24 : 12, bottom: 12 }}>
            <TrezorLogo width="107px" type="horizontal" />
        </Box>
    );
};

type SidebarProps = {
    showAccounts?: boolean;
};

export const Sidebar = ({ showAccounts = true }: SidebarProps) => {
    const [closedNotificationDevice, setClosedNotificationDevice] = useState(false);
    const [closedNotificationSuite, setClosedNotificationSuite] = useState(false);
    const [isBannerVisible, setIsBannerVisible] = useState(true);

    const {
        isSidebarCollapsed,
        setSidebarWidth,
        sidebarWidth,
        contentWidth,
        forcedSidebarWidth,
        setForcedSidebarWidth,
        lastManualSidebarWidth,
        autoCollapsed,
        setAutoCollapsed,
        userResizingSidebar,
        setUserResizingSidebar,
        autoCollapseSuppressed,
        setAutoCollapseSuppressed,
    } = useResponsiveContext();
    const dispatch = useDispatch();

    const { elevation } = useElevation();
    const { updateStatusDevice, updateStatusSuite } = useUpdateStatus();

    const shouldDisplayDeviceCompromised = useSelector(selectShouldDisplayDeviceCompromised);
    const selectedDevice = useSelector(selectSelectedDevice);

    const handleSidebarWidthChanged = (width: number) => {
        setSidebarWidth(width);
        dispatch(suiteSettingsActions.setSidebarWidth(width));
    };
    const handleSidebarWidthUpdate = (width: number) => {
        if (userResizingSidebar && typeof forcedSidebarWidth === 'number') {
            setForcedSidebarWidth(undefined);
            setAutoCollapsed(false);
            setSidebarWidth(width);

            return;
        }
        if (typeof forcedSidebarWidth !== 'number') setSidebarWidth(width);
    };

    useEffect(() => {
        const onResize = () => setAutoCollapseSuppressed(false);
        window.addEventListener('resize', onResize);

        return () => window.removeEventListener('resize', onResize);
    }, [setAutoCollapseSuppressed]);

    const onNotificationBannerClosed = () => {
        if (updateStatusSuite !== 'up-to-date') {
            setClosedNotificationSuite(true);
        }
        if (updateStatusDevice !== 'up-to-date') {
            setClosedNotificationDevice(true);
        }
    };

    const isUpdateAvailable =
        (updateStatusSuite !== 'up-to-date' && !closedNotificationSuite) ||
        (!['up-to-date', 'disconnected'].includes(updateStatusDevice) && !closedNotificationDevice);
    const showUpdateBannerNotification =
        !isSidebarCollapsed && isBannerVisible && isUpdateAvailable;

    const showAccountsAndIsDeviceReady =
        !shouldDisplayDeviceCompromised &&
        selectedDevice !== undefined &&
        selectedDevice.mode === 'normal' &&
        showAccounts;

    useEffect(() => {
        if (contentWidth == null) return;
        if (userResizingSidebar || autoCollapseSuppressed) return;

        if (!autoCollapsed && contentWidth < SIDEBAR_AUTO_COLLAPSE_BREAKPOINT) {
            setAutoCollapsed(true);
            if (forcedSidebarWidth !== SIDEBAR_MIN_WIDTH) {
                setForcedSidebarWidth(SIDEBAR_MIN_WIDTH);
            }

            return;
        }

        if (autoCollapsed) {
            const delta = Math.max(0, lastManualSidebarWidth - SIDEBAR_MIN_WIDTH);
            const uncollapseThreshold = SIDEBAR_AUTO_COLLAPSE_BREAKPOINT + delta;

            if (contentWidth > uncollapseThreshold) {
                setAutoCollapsed(false);
                if (typeof forcedSidebarWidth === 'number') {
                    setForcedSidebarWidth(undefined);
                }
            }
        }
    }, [
        contentWidth,
        autoCollapsed,
        setAutoCollapsed,
        forcedSidebarWidth,
        setForcedSidebarWidth,
        lastManualSidebarWidth,
        userResizingSidebar,
        autoCollapseSuppressed,
    ]);

    return (
        <Wrapper>
            <ResizableBox
                directions={['right']}
                width={sidebarWidth}
                minWidth={SIDEBAR_MIN_WIDTH}
                maxWidth={SIDEBAR_MAX_WIDTH}
                zIndex={zIndices.draggableComponent}
                onWidthResizeEnd={handleSidebarWidthChanged}
                onWidthResizeMove={handleSidebarWidthUpdate}
                onResizeStart={direction => {
                    if (direction === 'left' || direction === 'right') {
                        setUserResizingSidebar(true);
                        setAutoCollapseSuppressed(true);
                    }
                }}
                onResizeStop={() => {
                    setUserResizingSidebar(false);
                }}
                disabledWidthInterval={[SIDEBAR_MIN_WIDTH, SIDEBAR_COLLAPSED_WIDTH]}
                flex="1"
                forcedWidth={forcedSidebarWidth}
            >
                <Container $elevation={elevation}>
                    <TrafficLightOffset>
                        <Content>
                            <WalletSwitcher isCollapsed={isSidebarCollapsed} />
                            <ElevationUp>
                                <Navigation />
                            </ElevationUp>
                            <HorizontalSpacer>
                                {showAccountsAndIsDeviceReady && <AccountsMenu />}
                            </HorizontalSpacer>
                            <AnimatePresence onExitComplete={onNotificationBannerClosed}>
                                {isUpdateAvailable && showUpdateBannerNotification && (
                                    <UpdateNotificationBanner
                                        updateStatusDevice={updateStatusDevice}
                                        updateStatusSuite={updateStatusSuite}
                                        onClose={() => setIsBannerVisible(false)}
                                    />
                                )}
                            </AnimatePresence>
                            <QuickActions
                                isSidebarCollapsed={isSidebarCollapsed}
                                hideUpdateQuickAction={showUpdateBannerNotification}
                            />
                        </Content>
                    </TrafficLightOffset>
                </Container>
            </ResizableBox>
        </Wrapper>
    );
};
