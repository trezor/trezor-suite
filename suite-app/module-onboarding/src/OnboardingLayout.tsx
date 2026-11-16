import { type ReactNode, useRef } from 'react';
import { useSelector } from 'react-redux';

import styled from 'styled-components';

import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { TRAFFIC_LIGHT_DEFAULT_OFFSET } from '@suite/macos';
import { MODAL_CONTEXT_USER } from '@suite/modal';
import { gotoThunk } from '@suite/router';
import { ReduxModal } from '@suite-app/app-modal';
import { Box, Button, Column, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { isDesktop, isMacOs } from '@trezor/env-utils';
import { XIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';
import {
    ConnectionGlobalModalManager,
    GuideRouter,
    MAX_ONBOARDING_WIDTH,
    OnboardingCancelButtonContext,
    SuiteBanners,
    useFilteredModal,
    useOnboardingCancelButtonContext,
    useResponsiveContextOnChange,
} from '@trezor/suite';

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
        <Column gap={24}>
            <Row justifyContent="flex-end">
                <Row gap={12}>
                    {isDebugModeActive ? (
                        <Button
                            intent="neutral"
                            priority="secondary"
                            size="small"
                            onClick={goToSettings}
                            data-testid="@suite/menu/settings"
                        >
                            <DebugOnlyBadge>
                                <Translation id="TR_SETTINGS" />
                            </DebugOnlyBadge>
                        </Button>
                    ) : null}
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
            <Box>{children}</Box>
        </Column>
    );
};

type OnboardingLayoutProps = {
    children: ReactNode;
    sidebar: ReactNode;
};

export const OnboardingLayout = ({ children, sidebar }: OnboardingLayoutProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const isMac = isMacOs();
    const isDesktopApp = isDesktop();
    useResponsiveContextOnChange(contentRef);

    const allowedModal = useFilteredModal(
        [MODAL_CONTEXT_USER],
        ['advanced-coin-settings', 'disable-tor'],
    );

    return (
        <>
            <ConnectionGlobalModalManager />
            {allowedModal !== null ? <ReduxModal {...allowedModal} /> : null}
            <Row width="100%" height="100%" alignItems="stretch">
                {sidebar}
                <Column
                    ref={contentRef}
                    flex="1"
                    minWidth={0}
                    height="100%"
                    overflow="auto"
                    alignItems="center"
                >
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
                <GuideRouter />
            </Row>
        </>
    );
};
