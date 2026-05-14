import { type ReactNode, useRef, useState } from 'react';

import styled, { useTheme } from 'styled-components';

import { ScrollContext } from '@suite/router';
import { ElevationContext, ElevationDown, ElevationUp, Modal, variables } from '@trezor/components';

import { GuideButton, GuideRouter } from 'src/components/guide';
import { Metadata } from 'src/components/suite/Metadata';
import { SuiteBanners } from 'src/components/suite/banners';
import { DiscoveryProgress } from 'src/components/wallet';
import { HEADER_HEIGHT_NUMERIC, SUBPAGE_NAV_HEIGHT_NUMERIC } from 'src/constants/suite/layout';
import { useLayoutSize } from 'src/hooks/suite';
import { useClearAnchorHighlightOnClick } from 'src/hooks/suite/useClearAnchorHighlightOnClick';
import { useResetScrollOnUrl } from 'src/hooks/suite/useResetScrollOnUrl';
import { LayoutContext, type LayoutContextPayload } from 'src/support/suite/LayoutContext';

import { AppShortcuts } from './AppShortcuts';
import { CoinjoinBars } from './CoinjoinBars/CoinjoinBars';
import { DebugLegend } from './DebugLegend';
import { PassphraseFlow } from './PassphraseFlow';
import { PowerMonitorManager } from './PowerMonitor/PowerMonitor';
import { Sidebar } from './Sidebar/Sidebar';
import { ModalSwitcher } from '../../modals/ModalSwitcher/ModalSwitcher';
import { ContentContainer } from '../ContentContainer';
import { useResponsiveContextOnChange } from './useResponsiveContextOnChange';

export const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
    overflow: auto;
`;

export const PageWrapper = styled.div`
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100dvh;
    overflow-x: hidden;
`;

export const Body = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
`;

// AppWrapper and MenuSecondary creates own scrollbars independently
export const Columns = styled.div`
    display: flex;
    flex-direction: row;
    flex: 1 0 100%;
    overflow: auto;
    padding: 0;
`;

export const AppWrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: auto scroll;
    width: 100%;
    background: ${({ theme }) => theme.surfaceFillPage};
    align-items: center;
    position: relative;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        overflow-x: hidden;
    }
`;

export const MainContentContainer = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    overflow-x: hidden;
`;

type MainContentProps = {
    children: ReactNode;
};

const ANCHOR_SCROLL_OFFSET = 30;

export const MainContent = ({ children }: MainContentProps) => {
    const ref = useRef<HTMLDivElement>(null);

    useResponsiveContextOnChange(ref);

    return <MainContentContainer ref={ref}>{children}</MainContentContainer>;
};

interface SuiteLayoutProps {
    children: ReactNode;
    ['data-testid']?: string;
}

export const SuiteLayout = ({ children, 'data-testid': dataTest }: SuiteLayoutProps) => {
    const theme = useTheme();
    const [{ title, layoutHeader }, setLayoutPayload] = useState<LayoutContextPayload>({});

    const { isBelowTablet } = useLayoutSize();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { scrollRef } = useResetScrollOnUrl();
    const topOffset = HEADER_HEIGHT_NUMERIC + SUBPAGE_NAV_HEIGHT_NUMERIC + ANCHOR_SCROLL_OFFSET;

    useClearAnchorHighlightOnClick(wrapperRef);

    return (
        <ScrollContext.Provider value={{ scrollRef, topOffset }}>
            <ElevationContext baseElevation={-1}>
                <Wrapper ref={wrapperRef} data-testid="@suite-layout">
                    <PageWrapper>
                        <Modal.Provider>
                            <Metadata title={title} />

                            <ModalSwitcher />
                            <PassphraseFlow />

                            <AppShortcuts />
                            <PowerMonitorManager />

                            {isBelowTablet && <CoinjoinBars />}

                            <DiscoveryProgress />

                            <LayoutContext.Provider value={setLayoutPayload}>
                                <Body data-testid="@suite-layout/body">
                                    <Columns>
                                        <ElevationDown>
                                            <Sidebar />
                                        </ElevationDown>
                                        <MainContent>
                                            {!isBelowTablet && <CoinjoinBars />}
                                            <SuiteBanners />
                                            <AppWrapper data-testid="@app" ref={scrollRef}>
                                                <ElevationUp>
                                                    {layoutHeader}

                                                    <ContentContainer
                                                        data-testid={
                                                            dataTest
                                                                ? `${dataTest}/content`
                                                                : '@app/content'
                                                        }
                                                    >
                                                        {children}
                                                    </ContentContainer>
                                                </ElevationUp>
                                            </AppWrapper>
                                        </MainContent>
                                    </Columns>
                                </Body>
                            </LayoutContext.Provider>
                            {!isBelowTablet && <GuideButton />}
                        </Modal.Provider>
                    </PageWrapper>

                    <GuideRouter />
                </Wrapper>
                {theme.variant === 'debug' && <DebugLegend layout={SuiteLayout.name} />}
            </ElevationContext>
        </ScrollContext.Provider>
    );
};
