import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import styled from 'styled-components';

import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { TRAFFIC_LIGHT_DEFAULT_OFFSET } from '@suite/macos';
import { MODAL_CONTEXT_USER } from '@suite/modal';
import { gotoThunk } from '@suite/router';
import { Box, Button, Column, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { isDesktop, isMacOs } from '@trezor/env-utils';
import { XIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import { TREZOR_SUPPORT_URL } from '@trezor/urls';

import { GuideButton, GuideRouter } from 'src/components/guide';
import { OnboardingProgressBar } from 'src/components/onboarding/OnboardingProgressBar';
import { SuiteBanners } from 'src/components/suite/banners';
import { ReduxModal } from 'src/components/suite/modals/ReduxModal/ReduxModal';
import { MAX_ONBOARDING_WIDTH } from 'src/constants/suite/layout';
import { useFilteredModal } from 'src/hooks/suite';

import {
    OnboardingCancelButtonContext,
    useOnboardingCancelButtonContext,
} from './OnboardingCancelButtonContext';
import { SmallDeviceItem } from '../../views/suite/SwitchDevice/DeviceItem/SmallDeviceItem';
import { ConnectionGlobalModalManager } from '../connection/ConnectionGlobalModalManager';

const OnboardingSpacer = styled.div`
    height: ${TRAFFIC_LIGHT_DEFAULT_OFFSET}px;
    width: 100%;
`;

type OnboardingContentProps = {
    children: ReactNode;
};

const OnboardingContent = ({ children }: OnboardingContentProps) => {
    const { onCancelHandler } = useOnboardingCancelButtonContext();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const { dispatch } = useServices(injectDispatch);

    const goToSettings = () => dispatch(gotoThunk({ routeName: 'settings-index' }));

    return (
        <Column gap={40}>
            <Column gap={32}>
                <Row justifyContent="space-between">
                    <SmallDeviceItem />
                    <Row gap={12}>
                        {isDebugModeActive ? (
                            <Button
                                intent="neutral"
                                priority="secondary"
                                size="small"
                                onClick={goToSettings}
                            >
                                <DebugOnlyBadge>
                                    <Translation id="TR_SETTINGS" />
                                </DebugOnlyBadge>
                            </Button>
                        ) : null}
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
                                iconRight={XIcon}
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
        </>
    );
};
