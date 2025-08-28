import { ReactNode } from 'react';

import styled from 'styled-components';

import {
    Column,
    Divider,
    ElevationDown,
    ElevationUp,
    Modal,
    Row,
    useElevation,
    variables,
} from '@trezor/components';
import { Elevation, borders, spacingsPx } from '@trezor/theme';

import { GuideButton, GuideRouter } from 'src/components/guide';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { SuiteBanners } from 'src/components/suite/banners';
import { MAX_WELCOME_LAYOUT_WIDTH } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';
import { selectIsTEXDashboardPromoBannerShown } from 'src/selectors/suite/suiteSelectors';
import { ResponsiveContextProvider } from 'src/support/suite/ResponsiveContext';
import { DashboardPromoBanner } from 'src/views/dashboard/DashboardPromoBanner/DashboardPromoBanner';

import { LoggedOutSidebar } from '../LoggedOutSidebar';
import { DebugLegend } from '../SuiteLayout/DebugLegend';
import { BasicName } from '../SuiteLayout/PageHeader/PageNames/BasicName';

const Content = styled.div<{ $elevation: Elevation; $verticalCenter?: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: ${spacingsPx.lg};
    align-items: center;
    overflow-y: auto;
    height: 100%;
    max-width: ${MAX_WELCOME_LAYOUT_WIDTH}px;
    ${props =>
        props.$verticalCenter &&
        `
        justify-content: center;
    `}

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: ${spacingsPx.sm};
    }
`;

const PureChildrenWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: ${MAX_WELCOME_LAYOUT_WIDTH}px;
`;

const ChildrenWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: ${MAX_WELCOME_LAYOUT_WIDTH}px;
    gap: ${spacingsPx.md};
    padding: ${spacingsPx.xxl};
    border-radius: ${borders.radii.md};
    border: ${borders.widths.small} solid ${({ theme }) => theme.borderElevation1};
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation1};
`;

const WelcomePageHeaderWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
`;

export type WelcomeLayoutWithoutModalSwitcherProps = {
    children: ReactNode;
    showPureChildren?: boolean;
    hideSidebar?: boolean;
};

type RightContentProps = {
    children: ReactNode;
    showPureChildren: boolean;
    bannerSlot?: ReactNode;
};

const RightSideContent = ({ bannerSlot, showPureChildren, children }: RightContentProps) => {
    const { elevation } = useElevation();

    const shouldShowTEXDashboardPromoBanner = useSelector(selectIsTEXDashboardPromoBannerShown);

    if (showPureChildren) {
        return (
            <Content $elevation={elevation} $verticalCenter={true}>
                {bannerSlot ?? null}
                <PureChildrenWrapper>
                    <ElevationUp>{children}</ElevationUp>
                </PureChildrenWrapper>
            </Content>
        );
    }

    return (
        <ResponsiveContextProvider>
            <Content $elevation={elevation}>
                {bannerSlot ?? null}
                <WelcomePageHeaderWrapper>
                    <BasicName nameId="TR_DASHBOARD" />
                    <Divider />
                </WelcomePageHeaderWrapper>
                <ChildrenWrapper>
                    <ElevationUp>{children}</ElevationUp>
                </ChildrenWrapper>
                {shouldShowTEXDashboardPromoBanner && (
                    <>
                        <Divider />
                        <DashboardPromoBanner />
                        <Divider />
                    </>
                )}
            </Content>
        </ResponsiveContextProvider>
    );
};

// WelcomeLayout is a top-level wrapper similar to @suite-components/SuiteLayout
// used in Preloader and Onboarding
export const WelcomeLayoutWithoutModalSwitcher = ({
    children,
    hideSidebar,
    showPureChildren = false,
}: WelcomeLayoutWithoutModalSwitcherProps) => {
    const theme = useSelector(state => state.suite.settings.theme);

    return (
        <ElevationDown>
            <Column height="100%" width="100%">
                <Row
                    height="100%"
                    width="100%"
                    data-testid="@welcome-layout/body"
                    alignItems="normal"
                >
                    <Modal.Provider>
                        {!hideSidebar ? (
                            <ElevationDown>
                                <LoggedOutSidebar />
                            </ElevationDown>
                        ) : null}
                        <RightSideContent
                            showPureChildren={showPureChildren}
                            bannerSlot={<SuiteBanners fill />}
                        >
                            {children}
                        </RightSideContent>
                        <GuideButton />
                        <GuideRouter />
                    </Modal.Provider>
                </Row>
            </Column>
            {theme.variant === 'debug' && <DebugLegend />}
        </ElevationDown>
    );
};
