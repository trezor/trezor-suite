import { ReactNode } from 'react';

import styled from 'styled-components';

import { selectBannerMessage } from '@suite-common/message-system';
import {
    Column,
    ElevationDown,
    ElevationUp,
    Row,
    useElevation,
    variables,
} from '@trezor/components';
import {
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
    spacings,
    spacingsPx,
} from '@trezor/theme';

import { GuideButton, GuideRouter } from 'src/components/guide';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { MessageSystemBanner } from 'src/components/suite/banners';
import { MAX_ONBOARDING_WIDTH } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';

import { TrafficLightOffset } from '../../TrafficLightOffset';
import { Nav, SETTINGS_ROUTES } from '../SuiteLayout/Sidebar/Navigation';
import { NavItem } from '../SuiteLayout/Sidebar/NavigationItem';
import { QuickActions } from '../SuiteLayout/Sidebar/QuickActions/QuickActions';
import { SIDEBAR_MIN_WIDTH } from '../SuiteLayout/Sidebar/Sidebar';

const WelcomeWrapper = styled.div<{ $elevation: Elevation }>`
    background-color: ${mapElevationToBackground};
    height: 100%;
`;

const Content = styled.div<{ $elevation: Elevation }>`
    display: flex;
    position: relative;
    flex-direction: column;
    flex: 3;
    padding: ${spacingsPx.lg};
    align-items: center;
    overflow-y: auto;
    height: 100%;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: ${spacingsPx.sm};
    }
`;

const ChildrenWrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: ${MAX_ONBOARDING_WIDTH}px;
`;

interface WelcomeLayoutProps {
    children: ReactNode;
}

const WelcomeNavColumn = styled.div<{ $elevation: Elevation; $minWidth: number }>`
    border-right: solid 1px ${mapElevationToBorder};
    min-width: ${({ $minWidth }) => $minWidth}px;
    height: 100%;
`;

export const LoggedOutSidebar = () => {
    const { elevation } = useElevation();

    return (
        <WelcomeWrapper $elevation={elevation}>
            <ElevationUp>
                <WelcomeNavColumn $elevation={elevation} $minWidth={SIDEBAR_MIN_WIDTH}>
                    <TrafficLightOffset>
                        <Column justifyContent="space-between" height="100%">
                            <Nav $isSidebarCollapsed>
                                <NavItem
                                    nameId="TR_START"
                                    icon="trezorLogo"
                                    goToRoute="suite-start"
                                    routes={['suite-start']}
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
                            <QuickActions isSidebarCollapsed />
                        </Column>
                    </TrafficLightOffset>
                </WelcomeNavColumn>
            </ElevationUp>
        </WelcomeWrapper>
    );
};

const Right = ({ children }: { children: ReactNode }) => {
    const { elevation } = useElevation();

    return (
        <Content $elevation={elevation}>
            <ChildrenWrapper>
                <ElevationUp>{children}</ElevationUp>
            </ChildrenWrapper>
        </Content>
    );
};

// WelcomeLayout is a top-level wrapper similar to @suite-components/SuiteLayout
// used in Preloader and Onboarding
export const WelcomeLayout = ({ children }: WelcomeLayoutProps) => {
    const bannerMessage = useSelector(selectBannerMessage);

    return (
        <ElevationDown>
            <Column height="100%" width="100%">
                {bannerMessage && (
                    <MessageSystemBanner message={bannerMessage} margin={spacings.xs} />
                )}

                <Row height="100%" width="100%" data-testid="@welcome-layout/body">
                    <ElevationDown>
                        <LoggedOutSidebar />
                    </ElevationDown>

                    <Right>{children}</Right>

                    <GuideButton />
                    <GuideRouter />
                </Row>
            </Column>
        </ElevationDown>
    );
};
