import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { MODAL_CONTEXT_USER } from '@suite/modal';
import { selectThemeSettings } from '@suite/settings';
import { Box, Button, Column, Row } from '@trezor/components';
import { isDesktop, isMacOs } from '@trezor/env-utils';
import { TREZOR_SUPPORT_URL } from '@trezor/urls';

import { GuideButton, GuideRouter } from 'src/components/guide';
import { OnboardingProgressBar } from 'src/components/onboarding/OnboardingProgressBar';
import { SuiteBanners } from 'src/components/suite/banners';
import { ReduxModal } from 'src/components/suite/modals/ReduxModal/ReduxModal';
import { MAX_ONBOARDING_WIDTH } from 'src/constants/suite/layout';
import { useFilteredModal, useSelector } from 'src/hooks/suite';

import {
    OnboardingCancelButtonContext,
    useOnboardingCancelButtonContext,
} from './OnboardingCancelButtonContext';
import { SmallDeviceItem } from '../../views/suite/SwitchDevice/DeviceItem/SmallDeviceItem';
import { ConnectionGlobalModalManager } from '../connection/ConnectionGlobalModalManager';
import { TRAFFIC_LIGHT_DEFAULT_OFFSET } from '../suite/TrafficLightOffset';
import { DebugLegend } from '../suite/layouts/SuiteLayout/DebugLegend';

const OnboardingSpacer = styled.div`
    height: ${TRAFFIC_LIGHT_DEFAULT_OFFSET}px;
    width: 100%;
`;

type OnboardingContentProps = {
    children: ReactNode;
};

const OnboardingContent = ({ children }: OnboardingContentProps) => {
    const { onCancelHandler } = useOnboardingCancelButtonContext();

    return (
        <Column gap={40}>
            <Column gap={32}>
                <Row justifyContent="space-between">
                    <SmallDeviceItem />
                    <Row gap={12}>
                        <Button
                            intent="neutral"
                            priority="secondary"
                            size="small"
                            href={TREZOR_SUPPORT_URL}
                        >
                            <Translation id="TR_HELP" />
                        </Button>
                        {onCancelHandler !== null ? (
                            <Button
                                intent="neutral"
                                priority="secondary"
                                iconRight="x"
                                size="small"
                                onClick={onCancelHandler}
                            >
                                <Translation id="TR_CANCEL" />
                            </Button>
                        ) : null}
                    </Row>
                </Row>
                <OnboardingProgressBar />
            </Column>
            <Box>{children}</Box>
        </Column>
    );
};

type OnboardingLayoutProps = {
    children: ReactNode;
};

export const OnboardingLayout = ({ children }: OnboardingLayoutProps) => {
    const theme = useSelector(selectThemeSettings);

    const isMac = isMacOs();
    const isDesktopApp = isDesktop();

    const allowedModal = useFilteredModal(
        [MODAL_CONTEXT_USER],
        ['advanced-coin-settings', 'disable-tor'],
    );

    return (
        <>
            <ConnectionGlobalModalManager />
            {allowedModal !== null ? <ReduxModal {...allowedModal} /> : null}
            <Row width="100%" height="100%">
                <Column width="100%" height="100%" overflow="auto" alignItems="center">
                    {isMac && isDesktopApp && <OnboardingSpacer />}
                    <Column
                        data-testid="@onboarding-layout/body"
                        gap={20}
                        maxWidth={MAX_ONBOARDING_WIDTH}
                        width="100%"
                        padding={{ horizontal: 20, top: 32, bottom: 48 }}
                    >
                        <SuiteBanners isOnboarding />
                        <OnboardingCancelButtonContext>
                            <OnboardingContent>{children}</OnboardingContent>
                        </OnboardingCancelButtonContext>
                    </Column>
                </Column>
                <GuideButton />
                <GuideRouter />
            </Row>
            {theme.variant === 'debug' && <DebugLegend layout={OnboardingLayout.name} />}
        </>
    );
};
