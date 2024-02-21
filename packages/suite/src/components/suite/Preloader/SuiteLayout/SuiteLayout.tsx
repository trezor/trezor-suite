import { useRef, useState, ReactNode } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import { SuiteBanners } from 'src/components/suite/banners';
import { Metadata } from 'src/components/suite';
import { GuideRouter, GuideButton } from 'src/components/guide';
import { HORIZONTAL_LAYOUT_PADDINGS, MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';
import { DiscoveryProgress } from 'src/components/wallet';
import { useLayoutSize } from 'src/hooks/suite';
import { LayoutContext, LayoutContextPayload } from 'src/support/suite/LayoutContext';
import { useResetScrollOnUrl } from 'src/hooks/suite/useResetScrollOnUrl';
import { useClearAnchorHighlightOnClick } from 'src/hooks/suite/useClearAnchorHighlightOnClick';
import { ModalContextProvider } from 'src/support/suite/ModalContext';
import { ModalSwitcher } from '../../modals/ModalSwitcher/ModalSwitcher';
import { MobileMenu } from './MobileMenu/MobileMenu';
import { Sidebar } from './Sidebar/Sidebar';
import { CoinjoinBars } from './CoinjoinBars/CoinjoinBars';
import { MobileAccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/MobileAccountsMenu';

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
    height: 100vh;
    overflow-x: hidden;
`;

export const Body = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden hidden;
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
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    align-items: center;
    position: relative;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        overflow-x: hidden;
    }
`;

export const ContentWrapper = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    max-width: ${MAX_CONTENT_WIDTH};
    padding: ${spacingsPx.lg} ${HORIZONTAL_LAYOUT_PADDINGS} 134px ${HORIZONTAL_LAYOUT_PADDINGS};

    ${variables.SCREEN_QUERY.MOBILE} {
        padding-bottom: ${spacingsPx.xxxxl};
    }
`;

interface SuiteLayoutProps {
    children: ReactNode;
}

export const SuiteLayout = ({ children }: SuiteLayoutProps) => {
    const [{ title, TopMenu }, setLayoutPayload] = useState<LayoutContextPayload>({});

    const { isMobileLayout } = useLayoutSize();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { scrollRef } = useResetScrollOnUrl();

    useClearAnchorHighlightOnClick(wrapperRef);

    return (
        <Wrapper ref={wrapperRef}>
            <PageWrapper>
                <ModalContextProvider>
                    <Metadata title={title} />

                    <ModalSwitcher />

                    <SuiteBanners />
                    <CoinjoinBars />

                    {isMobileLayout && <MobileMenu />}

                    <DiscoveryProgress />

                    <LayoutContext.Provider value={setLayoutPayload}>
                        <Body data-test-id="@suite-layout/body">
                            <Columns>
                                {!isMobileLayout && <Sidebar />}

                                <AppWrapper data-test-id="@app" ref={scrollRef} id="layout-scroll">
                                    {isMobileLayout && <MobileAccountsMenu />}
                                    {TopMenu && <TopMenu />}

                                    <ContentWrapper>{children}</ContentWrapper>
                                </AppWrapper>
                            </Columns>
                        </Body>
                    </LayoutContext.Provider>

                    {!isMobileLayout && <GuideButton />}
                </ModalContextProvider>
            </PageWrapper>

            <GuideRouter />
        </Wrapper>
    );
};
