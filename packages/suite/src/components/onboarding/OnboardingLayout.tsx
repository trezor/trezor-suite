import { useMemo, ReactNode } from 'react';
import styled from 'styled-components';

import { TrezorLogo, Button, variables } from '@trezor/components';
import { TREZOR_SUPPORT_URL } from '@trezor/urls';
import { TrezorLink, Translation } from 'src/components/suite';
import { OnboardingProgressBar } from 'src/components/onboarding';
import { useSelector, useOnboarding } from 'src/hooks/suite';
import { MAX_ONBOARDING_WIDTH } from 'src/constants/suite/layout';
import steps from 'src/config/onboarding/steps';
import { GuideButton, GuideRouter } from 'src/components/guide';
import { selectBannerMessage } from '@suite-common/message-system';
import { MessageSystemBanner } from 'src/components/suite/banners';
import { ModalContextProvider } from 'src/support/suite/ModalContext';
import { spacingsPx, zIndices } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    background: ${({ theme }) => theme.backgroundSurfaceElevation2};
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
    align-items: center;
    overflow: auto;
`;

const Header = styled.div`
    position: sticky;
    top: 0;
    display: flex;
    width: 100%;
    padding: ${spacingsPx.sm};
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
    max-width: ${MAX_ONBOARDING_WIDTH}px;
    background: ${({ theme }) => theme.backgroundSurfaceElevation2};
    box-shadow: 0 ${spacingsPx.md} ${spacingsPx.sm} ${spacingsPx.xxs}
        ${({ theme }) => theme.backgroundSurfaceElevation2};
    margin-bottom: ${spacingsPx.md};
    z-index: ${zIndices.base};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding: 0 ${spacingsPx.lg};
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        /* low width screen (mobile) */
        margin-bottom: ${spacingsPx.xl};
    }

    @media all and (max-height: ${variables.SCREEN_SIZE.SM}) {
        /* low height screen */
        padding: 0 ${spacingsPx.lg};
        margin-bottom: ${spacingsPx.xl};
    }
`;

const LogoHeaderRow = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    margin-top: ${spacingsPx.lg};
    margin-bottom: ${spacingsPx.xxl};

    ${variables.SCREEN_QUERY.MOBILE} {
        display: none;
    }
`;

const ProgressBarRow = styled.div`
    width: 100%;
    margin-bottom: ${spacingsPx.lg};

    ${variables.SCREEN_QUERY.MOBILE} {
        margin-bottom: 0;
    }
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    color: ${({ theme }) => theme.textSubdued};
    justify-content: center;
    align-items: center;
    max-width: ${MAX_ONBOARDING_WIDTH}px;
    width: 100%;
    padding: 0 ${spacingsPx.lg} ${spacingsPx.xxxxl} ${spacingsPx.lg};
`;

const progressBarSteps = [
    {
        key: 'device',
        label: <Translation id="TR_DEVICE" />,
    },
    {
        key: 'wallet',
        label: <Translation id="TR_ONBOARDING_STEP_WALLET" />,
    },
    {
        key: 'pin',
        label: <Translation id="TR_PIN" />,
    },
    {
        key: 'coins',
        label: <Translation id="TR_COINS" />,
    },
    {
        key: 'final',
    },
];

interface OnboardingLayoutProps {
    children: ReactNode;
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
                                        type="hint"
                                        variant="nostyle"
                                        href={TREZOR_SUPPORT_URL}
                                    >
                                        <Button
                                            variant="tertiary"
                                            icon="EXTERNAL_LINK"
                                            iconAlignment="right"
                                            size="small"
                                        >
                                            <Translation id="TR_HELP" />
                                        </Button>
                                    </TrezorLink>
                                </LogoHeaderRow>

                                <ProgressBarRow>
                                    <OnboardingProgressBar
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
                <GuideRouter />
            </Body>
        </Wrapper>
    );
};
