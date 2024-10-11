import React, { useState } from 'react';
import styled from 'styled-components';
import { DeviceSelector } from '../DeviceSelector/DeviceSelector';
import { Navigation } from './Navigation';
import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { QuickActions } from './QuickActions/QuickActions';
import { ElevationUp, ResizableBox, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBackground, mapElevationToBorder, zIndices } from '@trezor/theme';
import { useActions, useSelector } from 'src/hooks/suite';
import * as suiteActions from 'src/actions/suite/suiteActions';
import { TrafficLightOffset } from '../../../TrafficLightOffset';
import { UpdateNotificationBanner } from './QuickActions/Update/UpdateNotificationBanner';
import { useUpdateStatus } from './QuickActions/Update/useUpdateStatus';

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
const Content = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
`;

export const Sidebar = () => {
    const [closedNotificationDevice, setClosedNotificationDevice] = useState(false);
    const [closedNotificationSuite, setClosedNotificationSuite] = useState(false);

    const { elevation } = useElevation();
    const { updateStatusDevice, updateStatusSuite } = useUpdateStatus();

    const sidebarWidth = useSelector(state => state.suite.settings.sidebarWidth);
    const { setSidebarWidth } = useActions({
        setSidebarWidth: (width: number) => suiteActions.setSidebarWidth({ width }),
    });

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
        (updateStatusDevice !== 'up-to-date' && !closedNotificationDevice);

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
                        <TrafficLightOffset>
                            <Content>
                                <DeviceSelector />
                                <Navigation />
                                <AccountsMenu />

                                {showUpdateBannerNotification && (
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
