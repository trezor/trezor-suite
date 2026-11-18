import { type ReactNode, useRef } from 'react';

import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { Translation } from '@suite/intl';
import { TRAFFIC_LIGHT_DEFAULT_OFFSET } from '@suite/macos';
import { MODAL_CONTEXT_USER } from '@suite/modal';
import { gotoThunk } from '@suite/router';
import { ReduxModal } from '@suite-app/app-modal';
import { Box, Button, Column, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { isDesktop, isMacOs } from '@trezor/env-utils';
import { injectDispatch } from '@trezor/redux-utils';
import {
    ConnectionGlobalModalManager,
    GuideRouter,
    MAX_CONTENT_WIDTH_NUMERIC,
    SuiteBanners,
    useFilteredModal,
    useResponsiveContextOnChange,
    useSelector,
} from '@trezor/suite';

type OnboardingLayoutProps = {
    children: ReactNode;
    sidebar: ReactNode;
};

export const OnboardingLayout = ({ children, sidebar }: OnboardingLayoutProps) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const { dispatch } = useServices(injectDispatch);
    const isMac = isMacOs();
    const isDesktopApp = isDesktop();
    useResponsiveContextOnChange(contentRef);

    const allowedModal = useFilteredModal(
        [MODAL_CONTEXT_USER],
        ['advanced-coin-settings', 'disable-tor'],
    );
    const goToSettings = () => dispatch(gotoThunk({ routeName: 'settings-index' }));

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
                    {isMac && isDesktopApp && (
                        <Box height={TRAFFIC_LIGHT_DEFAULT_OFFSET} width="100%" />
                    )}
                    <Column
                        data-testid="@onboarding-layout/body"
                        gap={20}
                        width="100%"
                        maxWidth={MAX_CONTENT_WIDTH_NUMERIC}
                        alignItems="center"
                        height="100%"
                        padding={{ horizontal: 20, vertical: 32 }}
                    >
                        <SuiteBanners isOnboarding />
                        {isDebugModeActive && (
                            <Row width="100%" justifyContent="flex-end">
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
                            </Row>
                        )}
                        <Box width="100%" margin={{ vertical: 'auto' }}>
                            {children}
                        </Box>
                    </Column>
                </Column>
                <GuideRouter />
            </Row>
        </>
    );
};
