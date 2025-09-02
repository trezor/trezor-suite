import { ReactNode, useRef, useState } from 'react';

import { Column, ElevationContext, ElevationDown, ElevationUp, Modal } from '@trezor/components';

import { GuideButton, GuideRouter } from 'src/components/guide';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { useClearAnchorHighlightOnClick } from 'src/hooks/suite/useClearAnchorHighlightOnClick';
import { useResetScrollOnUrl } from 'src/hooks/suite/useResetScrollOnUrl';
import { LayoutContext, LayoutContextPayload } from 'src/support/suite/LayoutContext';

import { Metadata } from '../Metadata';
import { ContentContainer } from './ContentContainer';
import { LoggedOutSidebar } from './LoggedOutSidebar';
import { SuiteBanners } from '../banners';
import { DebugLegend } from './SuiteLayout/DebugLegend';
import { AppWrapper, Body, Columns, PageWrapper, Wrapper } from './SuiteLayout/SuiteLayout';
import { ModalSwitcher } from '../modals/ModalSwitcher/ModalSwitcher';

interface LoggedOutLayout {
    children: ReactNode;
}

export const LoggedOutLayout = ({ children }: LoggedOutLayout) => {
    const [{ title, layoutHeader }, setLayoutPayload] = useState<LayoutContextPayload>({});

    const theme = useSelector(state => state.suite.settings.theme);
    const { scrollRef } = useResetScrollOnUrl();
    const { isBelowTablet } = useLayoutSize();
    const wrapperRef = useRef<HTMLDivElement>(null);

    useClearAnchorHighlightOnClick(wrapperRef);

    return (
        <ElevationContext baseElevation={-1}>
            <Wrapper ref={wrapperRef} data-testid="@logged-out-layout">
                <PageWrapper>
                    <Modal.Provider>
                        <Metadata title={title} />
                        <ModalSwitcher />

                        <LayoutContext.Provider value={setLayoutPayload}>
                            <Body data-testid="@suite-layout/body">
                                <Columns>
                                    <ElevationDown>
                                        <LoggedOutSidebar />
                                    </ElevationDown>
                                    <Column width="100%" alignItems="center">
                                        <SuiteBanners />
                                        <AppWrapper
                                            data-testid="@app"
                                            ref={scrollRef}
                                            id="layout-scroll"
                                        >
                                            {layoutHeader}
                                            <ElevationUp>
                                                <ContentContainer>{children}</ContentContainer>
                                            </ElevationUp>
                                        </AppWrapper>
                                    </Column>
                                </Columns>
                            </Body>
                        </LayoutContext.Provider>

                        {!isBelowTablet && <GuideButton />}
                    </Modal.Provider>
                </PageWrapper>
                <GuideRouter />
            </Wrapper>
            {theme.variant === 'debug' && <DebugLegend />}
        </ElevationContext>
    );
};
