import React, { useMemo } from 'react';
import styled from 'styled-components';

import { TrezorLogo, Button, variables } from '@trezor/components';
import { TREZOR_SUPPORT_URL } from '@trezor/urls';
import { TrezorLink, Translation } from 'src/components/suite';
import { ProgressBar } from 'src/components/onboarding';
import { useSelector, useOnboarding } from 'src/hooks/suite';
import { MAX_WIDTH } from 'src/constants/suite/layout';
import steps from 'src/config/onboarding/steps';
import { GuideButton, GuidePanel } from 'src/components/guide';
import { selectBannerMessage } from '@suite-common/message-system';
import MessageSystemBanner from 'src/components/suite/Banners/MessageSystemBanner';
import { ModalContextProvider } from 'src/support/suite/ModalContext';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    background: ${({ theme }) => theme.BG_LIGHT_GREY};
`;

const Body = styled.div`
    justify-content: center;
    display: flex;
    width: 100%;
    height: 100%;
`;

const ScrollingWrapper = styled.div`
    position: relative;
    display: flex;
    width: 100%;
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 20px;
    align-items: center;
    overflow: auto;
`;

const Header = styled.div`
    display: flex;
    width: 100%;
    padding: 10px;
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
    max-width: ${MAX_WIDTH};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding: 0px 20px;
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        /* low width screen (mobile) */
        margin-bottom: 26px;
    }

    @media all and (max-height: ${variables.SCREEN_SIZE.SM}) {
        /* low height screen */
        padding: 0px 20px;
        margin-bottom: 26px;
    }
`;

const LogoHeaderRow = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    margin-bottom: 30px;

    ${variables.SCREEN_QUERY.MOBILE} {
        display: none;
    }
`;

const ProgressBarRow = styled.div`
    width: 100%;
    margin-bottom: 20px;

    ${variables.SCREEN_QUERY.MOBILE} {
        margin-bottom: 0;
    }
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    color: ${props => props.theme.TYPE_DARK_GREY};
    justify-content: center;
    align-items: center;
    max-width: ${MAX_WIDTH};
    width: 100%;
    padding-bottom: 48px;
`;

const progressBarSteps = [
    {
        key: 'fw',
        label: <Translation id="TR_ONBOARDING_STEP_FIRMWARE" />,
    },
    {
        key: 'wallet',
        label: <Translation id="TR_ONBOARDING_STEP_WALLET" />,
    },
    {
        key: 'pin',
        label: <Translation id="TR_ONBOARDING_STEP_PIN" />,
    },
    {
        key: 'coins',
        label: <Translation id="TR_ONBOARDING_STEP_COINS" />,
    },
    {
        key: 'final',
    },
];

interface OnboardingLayoutProps {
    children: React.ReactNode;
}

export const OnboardingLayout = ({ children }: OnboardingLayoutProps) => {
    const bannerMessage = useSelector(selectBannerMessage);
    const { activeStepId } = useOnboarding();

    const activeStep = useMemo(() => steps.find(step => step.id === activeStepId)!, [activeStepId]);

    return (
        <Wrapper>
            {bannerMessage && <MessageSystemBanner message={bannerMessage} />}

            <Body data-test="@onboarding-layout/body">
                <ScrollingWrapper>
                    <ModalContextProvider>
                        <ContentWrapper id="layout-scroll">
                            <Header>
                                <LogoHeaderRow>
                                    <TrezorLogo type="suite" width="128px" />

                                    <TrezorLink
                                        size="small"
                                        variant="nostyle"
                                        href={TREZOR_SUPPORT_URL}
                                    >
                                        <Button
                                            variant="tertiary"
                                            icon="EXTERNAL_LINK"
                                            alignIcon="right"
                                        >
                                            <Translation id="TR_HELP" />
                                        </Button>
                                    </TrezorLink>
                                </LogoHeaderRow>

                                <ProgressBarRow>
                                    <ProgressBar
                                        steps={progressBarSteps}
                                        activeStep={activeStep.stepGroup}
                                    />
                                </ProgressBarRow>
                            </Header>

                            <Content>{children}</Content>
                        </ContentWrapper>
                    </ModalContextProvider>
                </ScrollingWrapper>

                <GuideButton />
                <GuidePanel />
            </Body>
        </Wrapper>
    );
};
