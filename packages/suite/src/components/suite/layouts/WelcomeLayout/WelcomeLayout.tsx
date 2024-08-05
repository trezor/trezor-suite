import { ReactNode } from 'react';
import styled from 'styled-components';

import {
    variables,
    SVG_IMAGES,
    useElevation,
    ElevationUp,
    ElevationContext,
} from '@trezor/components';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { useSelector } from 'src/hooks/suite';
import { selectBannerMessage } from '@suite-common/message-system';
import { MessageSystemBanner } from 'src/components/suite/banners';
import { resolveStaticPath } from '@suite-common/suite-utils';
import { GuideButton, GuideRouter } from 'src/components/guide';
import { MAX_ONBOARDING_WIDTH } from 'src/constants/suite/layout';
import { Elevation, mapElevationToBackground, spacingsPx } from '@trezor/theme';
import { WelcomeSidebar } from './WelcomeSidebar';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
`;

const Body = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
`;

const Content = styled.div<{ $elevation: Elevation }>`
    display: flex;
    position: relative;
    flex-direction: column;
    flex: 3;
    padding: ${spacingsPx.lg};
    background-color: ${mapElevationToBackground};
    background-image: url(${resolveStaticPath(`images/svg/${SVG_IMAGES.ONBOARDING_WELCOME_BG}`)});
    background-repeat: no-repeat;
    background-position: center;
    background-attachment: local;
    background-size: 570px 570px;
    align-items: center;
    overflow-y: auto;

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
        <ElevationContext baseElevation={-1}>
            <Wrapper>
                {bannerMessage && <MessageSystemBanner message={bannerMessage} />}

                <Body data-testid="@welcome-layout/body">
                    <WelcomeSidebar />

                    <Right>{children}</Right>

                    <GuideButton />
                    <GuideRouter />
                </Body>
            </Wrapper>
        </ElevationContext>
    );
};
