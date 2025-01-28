import { ReactNode } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import styled from 'styled-components';

import { selectBannerMessage } from '@suite-common/message-system';
import {
    Button,
    Column,
    ElevationContext,
    ElevationDown,
    ElevationUp,
    Row,
    useElevation,
    variables,
} from '@trezor/components';
import { isWeb } from '@trezor/env-utils';
import { TrezorLogo } from '@trezor/product-components';
import { useOnce } from '@trezor/react-utils';
import { Elevation, mapElevationToBackground, spacings, spacingsPx } from '@trezor/theme';
import { SUITE_URL, TREZOR_URL } from '@trezor/urls';

import { GuideButton, GuideRouter } from 'src/components/guide';
import { Translation } from 'src/components/suite';
// importing directly, otherwise unit tests fail, seems to be a styled-components issue
import { MessageSystemBanner } from 'src/components/suite/banners';
import { MAX_ONBOARDING_WIDTH } from 'src/constants/suite/layout';
import { useGuide } from 'src/hooks/guide';
import { useSelector } from 'src/hooks/suite';

import { NavSettings } from './NavSettings';
import { TrafficLightOffset } from '../../TrafficLightOffset';

const Expander = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
    margin-top: 96px;
`;

const WelcomeWrapper = styled.div<{ $elevation: Elevation }>`
    background-color: ${mapElevationToBackground};
    height: 100%;

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const MotionWelcome = styled(motion.div)`
    height: 100%;
    overflow: hidden;
    min-width: 380px;
    max-width: 660px;
`;

const LinksContainer = styled.div`
    bottom: 0;
    display: flex;
    margin: ${spacingsPx.xl};
    align-items: center;
    flex-flow: row wrap;
    gap: ${spacingsPx.md};
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

const SettingsWrapper = styled.div`
    position: absolute;
    align-self: flex-end;
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

const Left = () => {
    const { elevation } = useElevation();

    const { isGuideOpen, isGuideOnTop } = useGuide();

    // do not animate welcome bar on initial load
    const isFirstRender = useOnce(true, false);

    return (
        <WelcomeWrapper $elevation={elevation}>
            <AnimatePresence>
                {(!isGuideOpen || isGuideOnTop) && (
                    <MotionWelcome
                        initial={{
                            width: isFirstRender ? '40vw' : 0,
                            minWidth: isFirstRender ? '380px' : 0,
                        }}
                        animate={{
                            width: '40vw',
                            minWidth: '380px',
                            transition: { duration: 0.3, bounce: 0 },
                        }}
                        exit={{
                            width: 0,
                            minWidth: 0,
                            transition: { duration: 0.3, bounce: 0 },
                        }}
                    >
                        <TrafficLightOffset>
                            <Column justifyContent="center" alignItems="center" height="100%">
                                <Expander data-testid="@welcome/title">
                                    <TrezorLogo type="symbol" width="57px" />
                                </Expander>

                                <LinksContainer>
                                    {isWeb() && (
                                        <Button
                                            variant="tertiary"
                                            icon="arrowUpRight"
                                            iconAlignment="right"
                                            href={SUITE_URL}
                                        >
                                            <Translation id="TR_ONBOARDING_DOWNLOAD_DESKTOP_APP" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="tertiary"
                                        icon="arrowUpRight"
                                        iconAlignment="right"
                                        href={TREZOR_URL}
                                    >
                                        trezor.io
                                    </Button>
                                </LinksContainer>
                            </Column>
                        </TrafficLightOffset>
                    </MotionWelcome>
                )}
            </AnimatePresence>
        </WelcomeWrapper>
    );
};

const Right = ({ children }: { children: ReactNode }) => {
    const { elevation } = useElevation();

    return (
        <Content $elevation={elevation}>
            <SettingsWrapper>
                <NavSettings />
            </SettingsWrapper>

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
            <TrafficLightOffset isVisible={Boolean(bannerMessage)}>
                <Column height="100%" width="100%">
                    {bannerMessage && (
                        <MessageSystemBanner message={bannerMessage} margin={spacings.xs} />
                    )}

                    <Row height="100%" width="100%" data-testid="@welcome-layout/body">
                        <ElevationDown>
                            <Left />
                        </ElevationDown>

                        <Right>{children}</Right>

                        <GuideButton />
                        <GuideRouter />
                    </Row>
                </Column>
            </TrafficLightOffset>
        </ElevationContext>
    );
};
