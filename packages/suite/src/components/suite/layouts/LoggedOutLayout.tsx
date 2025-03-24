import { ReactNode, useRef, useState } from 'react';

import { ElevationContext, ElevationDown, ElevationUp, NewModal } from '@trezor/components';

import { GuideButton, GuideRouter } from 'src/components/guide';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { useClearAnchorHighlightOnClick } from 'src/hooks/suite/useClearAnchorHighlightOnClick';
import { useResetScrollOnUrl } from 'src/hooks/suite/useResetScrollOnUrl';
import { LayoutContext, LayoutContextPayload } from 'src/support/suite/LayoutContext';
import { ModalContextProvider } from 'src/support/suite/ModalContext';

import { Metadata } from '../Metadata';
import { LoggedOutSidebar } from './LoggedOutSidebar';
import { DebugLegend } from './SuiteLayout/DebugLegend';
import {
    AppWrapper,
    Body,
    Columns,
    ContentWrapper,
    PageWrapper,
    Wrapper,
} from './SuiteLayout/SuiteLayout';
import { ModalSwitcher } from '../modals/ModalSwitcher/ModalSwitcher';

interface LoggedOutLayout {
    children: ReactNode;
}

export const LoggedOutLayout = ({ children }: LoggedOutLayout) => {
    const [{ title, layoutHeader }, setLayoutPayload] = useState<LayoutContextPayload>({});

    const theme = useSelector(state => state.suite.settings.theme);
    const { scrollRef } = useResetScrollOnUrl();
    const { isMobileLayout } = useLayoutSize();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useClearAnchorHighlightOnClick(wrapperRef);

    return (
        <ElevationContext baseElevation={-1}>
            <Wrapper ref={wrapperRef} data-testid="@logged-out-layout">
                <PageWrapper>
                    <NewModal.Provider>
                        <ModalContextProvider>
                            <Metadata title={title} />
                            <ModalSwitcher />

                            <LayoutContext.Provider value={setLayoutPayload}>
                                <Body data-testid="@suite-layout/body">
                                    <Columns>
                                        <ElevationDown>
                                            <LoggedOutSidebar />
                                        </ElevationDown>
                                        <AppWrapper
                                            data-testid="@app"
                                            ref={scrollRef}
                                            id="layout-scroll"
                                        >
                                            {layoutHeader}
                                            <ElevationUp>
                                                <ContentWrapper>{children}</ContentWrapper>
                                            </ElevationUp>
                                        </AppWrapper>
                                    </Columns>
                                </Body>
                            </LayoutContext.Provider>

                            {!isMobileLayout && <GuideButton />}
                        </ModalContextProvider>
                    </NewModal.Provider>
                </PageWrapper>
                <GuideRouter />
            </Wrapper>
            {theme.variant === 'debug' && <DebugLegend />}
        </ElevationContext>
    );
};
