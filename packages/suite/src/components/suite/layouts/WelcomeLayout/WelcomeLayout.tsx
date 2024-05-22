import { ReactNode } from 'react';

import styled from 'styled-components';

import { selectBannerMessage } from '@suite-common/message-system';
import {
    Column,
    ElevationDown,
    ElevationUp,
    NewModal,
    Row,
    useElevation,
    variables,
} from '@trezor/components';
import { Elevation, spacings, spacingsPx } from '@trezor/theme';

import { GuideButton, GuideRouter } from 'src/components/guide';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { MessageSystemBanner } from 'src/components/suite/banners';
import { MAX_ONBOARDING_WIDTH } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';

import { LoggedOutSidebar } from '../LoggedOutSidebar';
import { DebugLegend } from '../SuiteLayout/DebugLegend';

const Content = styled.div<{ $elevation: Elevation }>`
    display: flex;
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

const Right = ({ bannerSlot, children }: { bannerSlot?: ReactNode; children: ReactNode }) => {
    const { elevation } = useElevation();

    return (
        <Content $elevation={elevation}>
            {bannerSlot ?? null}
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
                    <NewModal.Provider>
                        <ElevationDown>
                            <LoggedOutSidebar />
                        </ElevationDown>

                        <Right
                            bannerSlot={
                                bannerMessage && (
                                    <MessageSystemBanner
                                        message={bannerMessage}
                                        margin={spacings.xs}
                                        width="100%"
                                    />
                                )
                            }
                        >
                            {children}
                        </Right>

                        <GuideButton />
                        <GuideRouter />
                    </NewModal.Provider>
                </Row>
            </Column>
            {theme.variant === 'debug' && <DebugLegend />}
        </ElevationDown>
    );
};
