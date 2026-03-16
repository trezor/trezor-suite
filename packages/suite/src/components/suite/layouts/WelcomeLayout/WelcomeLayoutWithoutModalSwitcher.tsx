import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import {
    Column,
    ElevationDown,
    ElevationUp,
    Modal,
    Row,
    useElevation,
    variables,
} from '@trezor/components';
import { type Elevation, spacingsPx } from '@trezor/theme';

import { GuideButton, GuideRouter } from 'src/components/guide';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { SuiteBanners } from 'src/components/suite/banners';
import { useSelector } from 'src/hooks/suite';

import { TrafficLightOffset } from '../../TrafficLightOffset';
import { ContentContainer } from '../ContentContainer';
import { PageHeader } from '../SuiteLayout';
import { DebugLegend } from '../SuiteLayout/DebugLegend';
import { BasicName } from '../SuiteLayout/PageHeader/PageNames/BasicName';
import { Sidebar } from '../SuiteLayout/Sidebar/Sidebar';
import { MainContent } from '../SuiteLayout/SuiteLayout';

const Content = styled.div<{ $elevation: Elevation; $verticalCenter?: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    overflow-y: auto;
    height: 100%;
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
    showAccounts?: boolean;
};

type RightContentProps = {
    children: ReactNode;
    showPureChildren: boolean;
};

const RightSideContent = ({ showPureChildren, children }: RightContentProps) => {
    const { elevation } = useElevation();

    if (showPureChildren) {
        return (
            <TrafficLightOffset>
                <SuiteBanners />
                <Content $elevation={elevation} $verticalCenter={true}>
                    <PureChildrenWrapper>
                        <ElevationUp>{children}</ElevationUp>
                    </PureChildrenWrapper>
                </Content>
            </TrafficLightOffset>
        );
    }

    return (
        <>
            <SuiteBanners />
            <WelcomePageHeaderWrapper>
                <PageHeader>
                    <BasicName>
                        <Translation id="TR_DASHBOARD" />
                    </BasicName>
                </PageHeader>
            </WelcomePageHeaderWrapper>
            <ContentContainer>
                <ElevationUp>{children}</ElevationUp>
            </ContentContainer>
        </>
    );
};

// WelcomeLayout is a top-level wrapper similar to @suite-components/SuiteLayout
// used in Preloader and Onboarding
export const WelcomeLayoutWithoutModalSwitcher = ({
    children,
    hideSidebar,
    showPureChildren = false,
    showAccounts = true,
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
                                <Sidebar showAccounts={showAccounts} />
                            </ElevationDown>
                        ) : null}
                        <MainContent>
                            <RightSideContent showPureChildren={showPureChildren}>
                                {children}
                            </RightSideContent>
                        </MainContent>
                        <GuideButton />
                        <GuideRouter />
                    </Modal.Provider>
                </Row>
            </Column>
            {theme.variant === 'debug' && (
                <DebugLegend layout={WelcomeLayoutWithoutModalSwitcher.name} />
            )}
        </ElevationDown>
    );
};
