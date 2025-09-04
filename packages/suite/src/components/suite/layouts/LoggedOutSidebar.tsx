import styled from 'styled-components';

import { Column, Icon, ResizableBox, useElevation } from '@trezor/components';
import { TrezorLogo } from '@trezor/product-components';
import {
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
    spacingsPx,
    zIndices,
} from '@trezor/theme';

import { setSidebarWidth as setSidebarWidthInRedux } from 'src/actions/suite/suiteActions';
import { useDispatch, useLayoutSize } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

import { TrafficLightOffset } from '../TrafficLightOffset';
import { Navigation } from './SuiteLayout/Sidebar/Navigation';
import { QuickActions } from './SuiteLayout/Sidebar/QuickActions/QuickActions';

const NavigationColumn = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.sm};
    padding: ${spacingsPx.sm};
`;

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

// need wrapper to align it with icons in the nav col
const TrezorLogoWrapper = styled.div`
    margin-left: ${spacingsPx.sm};
`;

const LOGGED_OUT_SIDEBAR_MIN_WIDTH = 84;
const LOGGED_OUT_SIDEBAR_DEFAULT_WIDTH = 240;

export const LoggedOutSidebar = () => {
    const { elevation } = useElevation();
    const { isBelowTablet } = useLayoutSize();
    const dispatch = useDispatch();
    const { isSidebarCollapsed, setSidebarWidth, sidebarWidth } = useResponsiveContext({
        forceIsSidebarCollapsed: isBelowTablet,
    });

    const handleSidebarWidthChanged = (width: number) => {
        setSidebarWidth(width);
        dispatch(setSidebarWidthInRedux({ width }));
    };
    const handleSidebarWidthUpdate = (width: number) => {
        setSidebarWidth(width);
    };

    return (
        <ResizableBox
            collapse={isSidebarCollapsed}
            directions={['right']}
            width={sidebarWidth ?? LOGGED_OUT_SIDEBAR_DEFAULT_WIDTH}
            minWidth={LOGGED_OUT_SIDEBAR_MIN_WIDTH}
            maxWidth={600}
            zIndex={zIndices.draggableComponent}
            onWidthResizeEnd={handleSidebarWidthChanged}
            onWidthResizeMove={handleSidebarWidthUpdate}
            disabledWidthInterval={[LOGGED_OUT_SIDEBAR_MIN_WIDTH, LOGGED_OUT_SIDEBAR_DEFAULT_WIDTH]}
        >
            <Container $elevation={elevation}>
                <TrafficLightOffset>
                    <Column justifyContent="space-between" height="100%">
                        <NavigationColumn>
                            {!isSidebarCollapsed && (
                                <TrezorLogoWrapper>
                                    <TrezorLogo width="107px" type="horizontal" />
                                </TrezorLogoWrapper>
                            )}
                            <Navigation margin={spacingsPx.zero}>
                                {isSidebarCollapsed && (
                                    <Icon name="trezorLogo" size="large" pointerEvents="none" />
                                )}
                            </Navigation>
                        </NavigationColumn>
                        <QuickActions
                            hideDeviceUpdateStatusBar
                            isSidebarCollapsed={isSidebarCollapsed}
                        />
                    </Column>
                </TrafficLightOffset>
            </Container>
        </ResizableBox>
    );
};
