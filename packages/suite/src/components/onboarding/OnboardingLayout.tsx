import { ReactNode } from 'react';

import styled from 'styled-components';

import { Button, Flex, Row, variables } from '@trezor/components';
import { isDesktop, isMacOs } from '@trezor/env-utils';
import { spacings, spacingsPx } from '@trezor/theme';
import { TREZOR_SUPPORT_URL } from '@trezor/urls';

import { MODAL } from 'src/actions/suite/constants';
import { GuideButton, GuideRouter } from 'src/components/guide';
import { OnboardingProgressBar } from 'src/components/onboarding';
import { Translation } from 'src/components/suite';
import { SuiteBanners } from 'src/components/suite/banners';
import { ReduxModal } from 'src/components/suite/modals/ReduxModal/ReduxModal';
import { MAX_ONBOARDING_WIDTH } from 'src/constants/suite/layout';
import { useFilteredModal, useSelector } from 'src/hooks/suite';

import {
    OnboardingCancelButtonContext,
    useOnboardingCancelButtonContext,
} from './OnboardingCancelButtonContext';
import { SmallDeviceItem } from '../../views/suite/SwitchDevice/DeviceItem/SmallDeviceItem';
import { ConnectionGlobalModal } from '../connection/ConnectionGlobalModal';
import { TRAFFIC_LIGHT_DEFAULT_OFFSET } from '../suite/TrafficLightOffset';
import { DebugLegend } from '../suite/layouts/SuiteLayout/DebugLegend';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
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
    flex-direction: column;
    width: 100%;
`;

const OnboardingSpacer = styled.div`
    height: ${TRAFFIC_LIGHT_DEFAULT_OFFSET}px;
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
    display: flex;
    width: 100%;
    padding: ${spacingsPx.sm};
    justify-content: space-between;
    align-items: center;
    flex-direction: column;
    max-width: ${MAX_ONBOARDING_WIDTH}px;
    margin-bottom: ${spacingsPx.md};

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
    const theme = useSelector(state => state.suite.settings.theme);

    const isMac = isMacOs();
    const isDesktopApp = isDesktop();

    const allowedModal = useFilteredModal(
        [MODAL.CONTEXT_USER],
        ['advanced-coin-settings', 'disable-tor'],
    );

    return (
        <>
            <ConnectionGlobalModal />
            {allowedModal !== null ? <ReduxModal {...allowedModal} /> : null}

            <Wrapper>
                <Body data-testid="@onboarding-layout/body">
                    <ScrollingWrapper>
                        {isMac && isDesktopApp && <OnboardingSpacer />}
                        <Flex direction="column" alignItems="center">
                            <SuiteBanners isOnboarding />
                        </Flex>
                        <OnboardingCancelButtonContext>
                            <OnboardingContent>{children}</OnboardingContent>
                        </OnboardingCancelButtonContext>
                    </ScrollingWrapper>

                    <GuideButton />
                    <GuideRouter />
                </Body>
            </Wrapper>
            {theme.variant === 'debug' && <DebugLegend />}
        </>
    );
};
