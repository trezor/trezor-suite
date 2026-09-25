import { type ReactNode, memo, useRef } from 'react';

import styled from 'styled-components';

import { Modal } from '@trezor/components';

import { GuideButton, GuideRouter } from 'src/components/guide';
import { SuiteBanners } from 'src/components/suite/banners';
import { DiscoveryProgress } from 'src/components/wallet';

import { AddPassphraseWalletFlow } from './AddPassphraseWalletFlow';
import { AnchorHighlightHandler } from './AnchorHighlightHandler';
import { AppScrollArea } from './AppScrollArea';
import { CoinjoinBars } from './CoinjoinBars/CoinjoinBars';
import { LayoutPayloadProvider } from './LayoutPayloadProvider';
import { AboveTabletOnly, BelowTabletOnly } from './LayoutSizeOnly';
import { LayoutMetadata } from './LayoutSlots';
import { PowerMonitorManager } from './PowerMonitor/PowerMonitor';
import { ScrollProvider } from './ScrollProvider';
import { Sidebar } from './Sidebar/Sidebar';
import { SwitchDeviceLayer } from './SwitchDeviceLayer';
import { useResponsiveContextOnChange } from './useResponsiveContextOnChange';
import { ModalSwitcher } from '../../modals/ModalSwitcher/ModalSwitcher';

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

// AppScrollArea and MenuSecondary creates own scrollbars independently
export const Columns = styled.div`
    display: flex;
    flex-direction: row;
    flex: 1 0 100%;
    overflow: auto;
    padding: 0;
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

export const MainContent = ({ children }: MainContentProps) => {
    const ref = useRef<HTMLDivElement>(null);

    useResponsiveContextOnChange(ref);

    return <MainContentContainer ref={ref}>{children}</MainContentContainer>;
};

interface SuiteLayoutProps {
    children: ReactNode;
    ['data-testid']?: string;
}

/**
 * Memoised because it is the app root of every page: `Preloader` re-renders on a long list of
 * store subscriptions, and without this every one of those re-renders would walk the whole
 * layout — sidebar, banners, page. `children` comes from `Preloader`'s own props, so it stays
 * referentially stable and React can bail out here.
 */
export const SuiteLayout = memo(({ children, 'data-testid': dataTest }: SuiteLayoutProps) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    return (
        <ScrollProvider scrollRef={scrollRef}>
            <Wrapper ref={wrapperRef} data-testid="@suite-layout">
                <AnchorHighlightHandler elementRef={wrapperRef} />
                <PageWrapper>
                    <Modal.Provider>
                        <LayoutPayloadProvider>
                            <LayoutMetadata />

                            <ModalSwitcher />
                            <SwitchDeviceLayer />
                            <AddPassphraseWalletFlow />

                            <PowerMonitorManager />

                            <BelowTabletOnly>
                                <CoinjoinBars />
                            </BelowTabletOnly>

                            <DiscoveryProgress />

                            <Body data-testid="@suite-layout/body">
                                <Columns>
                                    <Sidebar />
                                    <MainContent>
                                        <AboveTabletOnly>
                                            <CoinjoinBars />
                                        </AboveTabletOnly>
                                        <SuiteBanners />
                                        <AppScrollArea
                                            scrollRef={scrollRef}
                                            data-testid={
                                                dataTest ? `${dataTest}/content` : '@app/content'
                                            }
                                        >
                                            {children}
                                        </AppScrollArea>
                                    </MainContent>
                                </Columns>
                            </Body>
                            <AboveTabletOnly>
                                <GuideButton />
                            </AboveTabletOnly>
                        </LayoutPayloadProvider>
                    </Modal.Provider>
                </PageWrapper>

                <GuideRouter />
            </Wrapper>
        </ScrollProvider>
    );
});

SuiteLayout.displayName = 'SuiteLayout';
