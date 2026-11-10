import { type ReactNode, memo, useRef } from 'react';

import { Modal } from '@trezor/components';
import {
    AboveTabletOnly,
    AddPassphraseWalletFlow,
    AnchorHighlightHandler,
    AppScrollArea,
    Body,
    CoinjoinBars,
    Columns,
    DiscoveryProgress,
    GuideButton,
    GuideRouter,
    LayoutMetadata,
    LayoutPayloadProvider,
    MainContent,
    PageWrapper,
    PowerMonitorManager,
    ScrollProvider,
    SuiteBanners,
    SwitchDeviceLayer,
    Wrapper,
} from '@trezor/suite';

import { Sidebar } from './Sidebar/Sidebar';
import { ModalSwitcher } from '../ModalSwitcher/ModalSwitcher';

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

                            <DiscoveryProgress />

                            <Body data-testid="@suite-layout/body">
                                <Columns>
                                    <Sidebar />
                                    <MainContent>
                                        <CoinjoinBars />
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
