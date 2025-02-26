import styled from 'styled-components';

import { Route } from '@suite-common/suite-types';
import { Column, ElevationUp, useElevation } from '@trezor/components';
import { Elevation, mapElevationToBackground, mapElevationToBorder } from '@trezor/theme';

import { SIDEBAR_MIN_WIDTH } from './SuiteLayout/Sidebar/Sidebar';
import { useSelector } from '../../../hooks/suite';
import { selectIsInitialRun } from '../../../reducers/suite/suiteReducer';
import { TrafficLightOffset } from '../TrafficLightOffset';
import { Nav, SETTINGS_ROUTES } from './SuiteLayout/Sidebar/Navigation';
import { NavItem } from './SuiteLayout/Sidebar/NavigationItem';
import { QuickActions } from './SuiteLayout/Sidebar/QuickActions/QuickActions';

const SidebarWrapper = styled.div<{ $elevation: Elevation }>`
    background-color: ${mapElevationToBackground};
    height: 100%;
`;

const SidebarNavColumn = styled.div<{ $elevation: Elevation; $minWidth: number }>`
    border-right: solid 1px ${mapElevationToBorder};
    min-width: ${({ $minWidth }) => $minWidth}px;
    height: 100%;
`;

export const LoggedOutSidebar = () => {
    const { elevation } = useElevation();

    const isInitialRun = useSelector(selectIsInitialRun);
    const startRoute: Route['name'] = isInitialRun ? 'suite-start' : 'suite-index';

    return (
        <SidebarWrapper $elevation={elevation}>
            <ElevationUp>
                <SidebarNavColumn $elevation={elevation} $minWidth={SIDEBAR_MIN_WIDTH}>
                    <TrafficLightOffset>
                        <Column justifyContent="space-between" height="100%">
                            <Nav $isSidebarCollapsed>
                                <NavItem
                                    nameId="TR_START"
                                    icon="trezorLogo"
                                    goToRoute={startRoute}
                                    routes={[startRoute]}
                                    data-testid="@suite/menu/suite-start"
                                />
                                <NavItem
                                    nameId="TR_SETTINGS"
                                    icon="gearSix"
                                    goToRoute="settings-index"
                                    routes={SETTINGS_ROUTES}
                                    data-testid="@suite/menu/settings"
                                />
                            </Nav>
                            <QuickActions hideUpdateStatusBar isSidebarCollapsed />
                        </Column>
                    </TrafficLightOffset>
                </SidebarNavColumn>
            </ElevationUp>
        </SidebarWrapper>
    );
};
