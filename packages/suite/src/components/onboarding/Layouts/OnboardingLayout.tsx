import React from 'react';
import styled from 'styled-components';

import { TrezorLogo, Button, variables } from '@trezor/components';
import { TrezorLink, Translation } from '@suite-components';
import ProgressBar from '@onboarding-components/ProgressBar';
import { useOnboarding, useSelector } from '@suite-hooks';
import { SUPPORT_URL } from '@suite-constants/urls';
import { MAX_WIDTH } from '@suite-constants/layout';
import steps from '@onboarding-config/steps';
import { GuideButton, GuidePanel } from '@guide-components';
import { useMessageSystem } from '@suite-hooks/useMessageSystem';
import MessageSystemBanner from '@suite-components/Banners/MessageSystemBanner';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    background: ${props => props.theme.BG_LIGHT_GREY};
`;

const Body = styled.div`
    justify-content: center;
    display: flex;
    width: 100%;
    height: 100%;
`;

const MaxWidth = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 1920px;
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

    @media all and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 0px 20px;
    }

    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
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

    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const ProgressBarRow = styled.div`
    margin-bottom: 20px;

    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
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

const StyledProgressBar = styled(ProgressBar)<{ guideOpen?: boolean }>`
    transition: all 0.3s;

    margin-right: ${props => (props.guideOpen ? '128px' : '224px')};

    @media (max-width: ${variables.SCREEN_SIZE.XL}) {
        margin-right: ${props => (props.guideOpen ? '0px' : '192px')};
    }

    @media (max-width: ${variables.SCREEN_SIZE.MD}) {
        margin-right: ${props => (props.guideOpen ? '0px' : '64px')};
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin-right: 0px;
    }
`;

interface Props {
    children: React.ReactNode;
}

const OnboardingLayout = ({ children }: Props) => {
    const { banner } = useMessageSystem();

    const { activeStepId } = useOnboarding();
    const activeStep = steps.find(step => step.id === activeStepId)!;

    const { guideOpen } = useSelector(state => ({
        guideOpen: state.guide.open,
    }));

    return (
        <Wrapper>
            {banner && <MessageSystemBanner message={banner} />}
            <Body>
                <MaxWidth>
                    <Header>
                        <LogoHeaderRow>
                            <TrezorLogo type="suite" width="128px" />

                            <TrezorLink size="small" variant="nostyle" href={SUPPORT_URL}>
                                <Button variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                                    <Translation id="TR_HELP" />
                                </Button>
                            </TrezorLink>
                        </LogoHeaderRow>
                        <ProgressBarRow>
                            <StyledProgressBar
                                guideOpen={guideOpen}
                                steps={[
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
                                ]}
                                activeStep={activeStep.stepGroup}
                            />
                        </ProgressBarRow>
                    </Header>

                    <Content>{children}</Content>
                </MaxWidth>
                <GuideButton />
                <GuidePanel />
            </Body>
        </Wrapper>
    );
};

export default OnboardingLayout;
