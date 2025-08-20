import styled from 'styled-components';

import { Column, ElevationUp, useElevation } from '@trezor/components';
import { TrezorLogo } from '@trezor/product-components';
import {
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
} from '@trezor/theme';

import { TrafficLightOffset } from '../TrafficLightOffset';
import { Navigation } from './SuiteLayout/Sidebar/Navigation';
import { QuickActions } from './SuiteLayout/Sidebar/QuickActions/QuickActions';

const NavigationColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.sm};
    padding: ${spacingsPx.sm};
`;

const SidebarWrapper = styled.div<{ $elevation: Elevation }>`
    background-color: ${mapElevationToBackground};
    height: 100%;
`;

const SidebarNavColumn = styled.div<{ $elevation: Elevation; $minWidth: number }>`
    border-right: solid 1px ${mapElevationToBorder};
    min-width: ${({ $minWidth }) => $minWidth}px;
    height: 100%;
`;

// need wrapper to align it with icons in the nav col
const TrezorLogoWrapper = styled.div`
    margin-left: ${spacingsPx.sm};
`;

const LOGGED_OUT_SIDEBAR_MIN_WIDTH = 240;

export const LoggedOutSidebar = () => {
    const { elevation } = useElevation();

    return (
        <SidebarWrapper $elevation={elevation}>
            <ElevationUp>
                <SidebarNavColumn $elevation={elevation} $minWidth={LOGGED_OUT_SIDEBAR_MIN_WIDTH}>
                    <TrafficLightOffset>
                        <Column justifyContent="space-between" height="100%">
                            <NavigationColumn>
                                <TrezorLogoWrapper>
                                    <TrezorLogo width="107px" type="horizontal" />
                                </TrezorLogoWrapper>
                                <Navigation margin={spacingsPx.zero} />
                            </NavigationColumn>
                            <QuickActions hideDeviceUpdateStatusBar isSidebarCollapsed={false} />
                        </Column>
                    </TrafficLightOffset>
                </SidebarNavColumn>
            </ElevationUp>
        </SidebarWrapper>
    );
};
