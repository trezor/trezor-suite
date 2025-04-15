import { ReactNode } from 'react';

import styled from 'styled-components';

import { selectBannerMessage } from '@suite-common/message-system';
import { Button, Row, variables } from '@trezor/components';
import { spacings, spacingsPx, zIndices } from '@trezor/theme';
import { TREZOR_SUPPORT_URL } from '@trezor/urls';

import { GuideButton, GuideRouter } from 'src/components/guide';
import { OnboardingProgressBar } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';
import { MessageSystemBanner } from 'src/components/suite/banners';
import { MAX_ONBOARDING_WIDTH } from 'src/constants/suite/layout';
import { useSelector } from 'src/hooks/suite';

import {
    OnboardingCancelButtonContext,
    useOnboardingCancelButtonContext,
} from './OnboardingCancelButtonContext';
import { SmallDeviceItem } from '../../views/suite/SwitchDevice/DeviceItem/SmallDeviceItem';
import { TrafficLightOffset } from '../suite/TrafficLightOffset';
import { DebugLegend } from '../suite/layouts/SuiteLayout/DebugLegend';

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
    justify-content: center;
    align-items: center;
    max-width: ${MAX_ONBOARDING_WIDTH}px;
    width: 100%;
    padding: 0 ${spacingsPx.lg} ${spacingsPx.xxxxl} ${spacingsPx.lg};
`;

type OnboardingContentProps = {
    children: ReactNode;
};

const OnboardingContent = ({ children }: OnboardingContentProps) => {
    const { onCancelHandler } = useOnboardingCancelButtonContext();

    return (
        <ContentWrapper id="layout-scroll">
            <Header>
                <LogoHeaderRow>
                    <SmallDeviceItem />

                    <Row gap={spacings.sm}>
                        <Button
                            variant="tertiary"
                            icon="arrowUpRight"
                            iconAlignment="end"
                            size="small"
                            href={TREZOR_SUPPORT_URL}
                        >
                            <Translation id="TR_HELP" />
                        </Button>
                        {onCancelHandler !== null ? (
                            <Button
                                variant="tertiary"
                                icon="x"
                                iconAlignment="end"
                                size="small"
                                onClick={onCancelHandler}
                            >
                                <Translation id="TR_CANCEL" />
                            </Button>
                        ) : null}
                    </Row>
                </LogoHeaderRow>

                <ProgressBarRow>
                    <OnboardingProgressBar />
                </ProgressBarRow>
            </Header>

            <Content>{children}</Content>
        </ContentWrapper>
    );
};

type OnboardingLayoutProps = {
    children: ReactNode;
};

export const OnboardingLayout = ({ children }: OnboardingLayoutProps) => {
    const bannerMessage = useSelector(selectBannerMessage);
    const theme = useSelector(state => state.suite.settings.theme);

    return (
        <TrafficLightOffset>
            <Wrapper>
                {bannerMessage && (
                    <MessageSystemBanner message={bannerMessage} margin={spacings.xs} />
                )}

                <Body data-testid="@onboarding-layout/body">
                    <ScrollingWrapper>
                        <OnboardingCancelButtonContext>
                            <OnboardingContent>{children}</OnboardingContent>
                        </OnboardingCancelButtonContext>
                    </ScrollingWrapper>

                    <GuideButton />
                    <GuideRouter />
                </Body>
            </Wrapper>
            {theme.variant === 'debug' && <DebugLegend />}
        </TrafficLightOffset>
    );
};
