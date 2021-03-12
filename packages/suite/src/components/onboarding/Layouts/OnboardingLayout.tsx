import React from 'react';
import styled from 'styled-components';
import { TrezorLogo, Button, variables } from '@trezor/components';
import { TrezorLink, Translation } from '@suite-components';
import ProgressBar from '@onboarding-components/ProgressBar';
import { useOnboarding } from '@suite-hooks';
import { SUPPORT_URL } from '@suite-constants/urls';
import { MAX_WIDTH } from '@suite-constants/layout';
import steps from '@onboarding-config/steps';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    background: ${props => props.theme.BG_LIGHT_GREY};
    overflow: auto;
`;

const StyledProgressBar = styled(ProgressBar)`
    margin: 0 64px;
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 0;
    }
`;

const HideInMobile = styled.div`
    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

const MaxWidth = styled.div`
    display: flex;
    flex-direction: column;
    max-width: 1920px;
    flex: 1;
    padding: 20px;
    align-items: center;
`;

const Header = styled.div`
    display: flex;
    width: 100%;
    padding: 26px 40px;
    margin-bottom: 46px;
    justify-content: space-between;
    align-items: center;

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

interface Props {
    children: React.ReactNode;
}

const OnboardingLayout = ({ children }: Props) => {
    const { activeStepId } = useOnboarding();
    const activeStep = steps.find(step => step.id === activeStepId)!;

    return (
        <Wrapper>
            <MaxWidth>
                <Header>
                    <HideInMobile>
                        <TrezorLogo type="suite" width="128px" />
                    </HideInMobile>
                    <StyledProgressBar
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
                    <HideInMobile>
                        <TrezorLink size="small" variant="nostyle" href={SUPPORT_URL}>
                            <Button variant="tertiary" icon="EXTERNAL_LINK" alignIcon="right">
                                <Translation id="TR_HELP" />
                            </Button>
                        </TrezorLink>
                    </HideInMobile>
                </Header>

                <Content>{children}</Content>
            </MaxWidth>
        </Wrapper>
    );
};

export default OnboardingLayout;
