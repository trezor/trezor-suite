import { ReactNode, createContext, useEffect, useRef, useState } from 'react';

import styled from 'styled-components';

import { ElevationContext, ElevationDown, ElevationUp, Modal, variables } from '@trezor/components';
import { useDebounce } from '@trezor/react-utils';
import { spacingsPx } from '@trezor/theme';

import { GuideButton, GuideRouter } from 'src/components/guide';
import { Metadata } from 'src/components/suite';
import { SuiteBanners } from 'src/components/suite/banners';
import { DiscoveryProgress } from 'src/components/wallet';
import { MobileAccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/MobileAccountsMenu';
import { HORIZONTAL_LAYOUT_PADDINGS, MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';
import { useLayoutSize, useSelector } from 'src/hooks/suite';
import { useClearAnchorHighlightOnClick } from 'src/hooks/suite/useClearAnchorHighlightOnClick';
import { useResetScrollOnUrl } from 'src/hooks/suite/useResetScrollOnUrl';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { LayoutContext, LayoutContextPayload } from 'src/support/suite/LayoutContext';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

import { AppShortcuts } from './AppShortcuts';
import { CoinjoinBars } from './CoinjoinBars/CoinjoinBars';
import { DebugLegend } from './DebugLegend';
import { MobileMenu } from './MobileMenu/MobileMenu';
import { PassphraseFlow } from './PassphraseFlow';
import { Sidebar } from './Sidebar/Sidebar';
import { ModalSwitcher } from '../../modals/ModalSwitcher/ModalSwitcher';

export const ScrollContext = createContext<React.RefObject<HTMLDivElement | null>>({
    current: null,
});

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
    padding: ${spacingsPx.xxl} ${HORIZONTAL_LAYOUT_PADDINGS} 134px ${HORIZONTAL_LAYOUT_PADDINGS};

    ${variables.SCREEN_QUERY.MOBILE} {
        padding-bottom: ${spacingsPx.xxxxl};
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

export const MainContent = ({ children }: MainContentProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const { setContentWidth } = useResponsiveContext();
    const debounce = useDebounce();

    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const newWidth = entries[0].contentRect.width;

                debounce(() => {
                    setContentWidth(newWidth);
                });
            }
        });

        if (ref.current) {
            const boundingRect = ref.current.getBoundingClientRect();

            setContentWidth(boundingRect.width);
            resizeObserver.observe(ref.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [ref, setContentWidth, debounce]);

    return <MainContentContainer ref={ref}>{children}</MainContentContainer>;
};

interface SuiteLayoutProps {
    children: ReactNode;
}

export const SuiteLayout = ({ children }: SuiteLayoutProps) => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const theme = useSelector(state => state.suite.settings.theme);
    const [{ title, layoutHeader }, setLayoutPayload] = useState<LayoutContextPayload>({});

    const { isBelowTablet } = useLayoutSize();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const { scrollRef } = useResetScrollOnUrl();
    useClearAnchorHighlightOnClick(wrapperRef);

    const isAccountPage = !!selectedAccount;

    return (
        <ScrollContext.Provider value={scrollRef}>
            <ElevationContext baseElevation={-1}>
                <Wrapper ref={wrapperRef} data-testid="@suite-layout">
                    <PageWrapper>
                        <Modal.Provider>
                            <Metadata title={title} />

                            <ModalSwitcher />
                            <PassphraseFlow />
                            <AppShortcuts />

                            {isBelowTablet && <CoinjoinBars />}

                            {isBelowTablet && <MobileMenu />}

                            <DiscoveryProgress />

                            <LayoutContext.Provider value={setLayoutPayload}>
                                <Body data-testid="@suite-layout/body">
                                    <Columns>
                                        {!isBelowTablet && (
                                            <ElevationDown>
                                                <Sidebar />
                                            </ElevationDown>
                                        )}
                                        <MainContent>
                                            {!isBelowTablet && <CoinjoinBars />}
                                            <SuiteBanners />
                                            <AppWrapper data-testid="@app" ref={scrollRef}>
                                                <ElevationUp>
                                                    {isBelowTablet && isAccountPage && (
                                                        <MobileAccountsMenu />
                                                    )}
                                                    {layoutHeader}

                                                    <ContentWrapper>{children}</ContentWrapper>
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
                {theme.variant === 'debug' && <DebugLegend />}
            </ElevationContext>
        </ScrollContext.Provider>
    );
};
