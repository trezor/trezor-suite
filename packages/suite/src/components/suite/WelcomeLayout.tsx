import React from 'react';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';

import { H1, TrezorLogo, Button, variables, SVG_IMAGES } from '@trezor/components';
import { useOnce } from '@trezor/react-utils';
import { Translation } from '@suite-components';
import { useSelector } from '@suite-hooks';
import { selectBannerMessage } from '@suite-common/message-system';
import MessageSystemBanner from '@suite-components/Banners/MessageSystemBanner';
import TrezorLink from '@suite-components/TrezorLink';
import { isWeb } from '@suite-utils/env';
import { TREZOR_URL, SUITE_URL } from '@trezor/urls';
import { resolveStaticPath } from '@suite-common/suite-utils';
import { GuideButton, GuidePanel } from '@guide-components';
import { useGuide } from '@guide-hooks';
import { NavSettings } from '@suite-components/NavigationBar/components/NavigationActions/components/NavSettings';

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

const Expander = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
`;

const WelcomeWrapper = styled.div`
    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;

const MotionWelcome = styled(motion.div)`
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: ${props => props.theme.BG_LIGHT_GREY};
    display: flex;
    height: 100%;
    overflow: hidden;
    min-width: 380px;
    max-width: 660px;
`;

const WelcomeTitle = styled(H1)`
    font-size: 60px;
    font-weight: bold;
    margin-top: 32px;
`;

const Bottom = styled.div`
    display: flex;
    margin: 24px 0px;
`;

const Content = styled.div`
    display: flex;
    position: relative;
    flex-direction: column;
    flex: 3;
    padding: 20px;
    background-color: ${props => props.theme.BG_GREY};
    background-image: url(${resolveStaticPath(`images/svg/${SVG_IMAGES.ONBOARDING_WELCOME_BG}`)});
    background-repeat: no-repeat;
    background-position: center;
    background-attachment: local;
    background-size: 570px 570px;
    color: ${props => props.theme.TYPE_DARK_GREY};
    align-items: center;
    overflow-y: auto;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 12px;
    }
`;

const StyledTrezorLink = styled(TrezorLink)`
    margin-right: 14px;
`;

const SettingsWrapper = styled.div`
    align-self: flex-end;
`;

interface WelcomeLayoutProps {
    children: React.ReactNode;
}

// WelcomeLayout is a top-level wrapper similar to @suite-components/SuiteLayout
// used in Preloader and Onboarding
export const WelcomeLayout = ({ children }: WelcomeLayoutProps) => {
    const bannerMessage = useSelector(selectBannerMessage);
    const { isGuideOpen, isGuideOnTop } = useGuide();

    // do not animate welcome bar on initial load
    const isFirstRender = useOnce(true, false);

    return (
        <Wrapper>
            {bannerMessage && <MessageSystemBanner message={bannerMessage} />}
            <Body data-test="@welcome-layout/body">
                <WelcomeWrapper>
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
                                <Expander>
                                    <TrezorLogo type="suite" width="128px" />
                                    <WelcomeTitle data-test="@welcome/title">
                                        <Translation id="TR_ONBOARDING_WELCOME_HEADING" />
                                    </WelcomeTitle>
                                </Expander>
                                <Bottom>
                                    {isWeb() && (
                                        <StyledTrezorLink
                                            size="small"
                                            variant="nostyle"
                                            href={SUITE_URL}
                                        >
                                            <Button
                                                variant="tertiary"
                                                icon="EXTERNAL_LINK"
                                                alignIcon="right"
                                            >
                                                <Translation id="TR_ONBOARDING_DOWNLOAD_DESKTOP_APP" />
                                            </Button>
                                        </StyledTrezorLink>
                                    )}
                                    <TrezorLink size="small" variant="nostyle" href={TREZOR_URL}>
                                        <Button
                                            variant="tertiary"
                                            icon="EXTERNAL_LINK"
                                            alignIcon="right"
                                        >
                                            trezor.io
                                        </Button>
                                    </TrezorLink>
                                </Bottom>
                            </MotionWelcome>
                        )}
                    </AnimatePresence>
                </WelcomeWrapper>
                <Content>
                    <SettingsWrapper>
                        <NavSettings />
                    </SettingsWrapper>
                    {children}
                </Content>

                <GuideButton />
                <GuidePanel />
            </Body>
        </Wrapper>
    );
};
