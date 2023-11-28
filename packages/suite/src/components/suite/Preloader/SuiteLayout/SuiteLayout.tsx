import { useEffect, useRef, useState, ReactNode, useMemo } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { SuiteBanners } from 'src/components/suite/banners';
import { Metadata } from 'src/components/suite';
import { GuideRouter, GuideButton } from 'src/components/guide';
import { HORIZONTAL_LAYOUT_PADDINGS, MAX_CONTENT_WIDTH } from 'src/constants/suite/layout';
import { DiscoveryProgress } from 'src/components/wallet';
import { onAnchorChange } from 'src/actions/suite/routerActions';
import { useLayoutSize, useSelector, useDevice, useDispatch } from 'src/hooks/suite';
import { LayoutContext, LayoutContextPayload } from 'src/support/suite/LayoutContext';
import { ModalContextProvider } from 'src/support/suite/ModalContext';
import { AccountsMenu } from 'src/components/wallet/WalletLayout/AccountsMenu/AccountsMenu';
import { ModalSwitcher } from '../../modals/ModalSwitcher/ModalSwitcher';
import { MobileNavigation } from './NavigationBar/MobileNavigation';
import { CoinjoinStatusBar } from './NavigationBar/CoinjoinStatusBar';
import { Sidebar } from './Sidebar/Sidebar';
import { spacingsPx } from '@trezor/theme';
import { useResetScrollOnUrl } from 'src/hooks/suite/useResetScrollOnUrl';

export const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
    overflow: auto;
`;

const PageWrapper = styled.div`
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
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    background: ${({ theme }) => theme.BG_GREY};
    flex-direction: column;
    overflow: auto scroll;
    width: 100%;
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
    padding: ${spacingsPx.lg} ${HORIZONTAL_LAYOUT_PADDINGS} 90px ${HORIZONTAL_LAYOUT_PADDINGS};

    ${variables.SCREEN_QUERY.MOBILE} {
        padding-bottom: ${spacingsPx.xxxxl};
    }
`;

type SuiteLayoutProps = {
    children: ReactNode;
};

export const SuiteLayout = ({ children }: SuiteLayoutProps) => {
    const anchor = useSelector(state => state.router.anchor);
    const initialRun = useSelector(state => state.suite.flags.initialRun);
    const coinjoinAccounts = useSelector(state => state.wallet.coinjoin.accounts);

    const [{ title, TopMenu }, setLayoutPayload] = useState<LayoutContextPayload>({});

    const { isMobileLayout } = useLayoutSize();
    const dispatch = useDispatch();
    const { device } = useDevice();
    const wrapperRef = useRef<HTMLDivElement>(null);

    const { scrollRef } = useResetScrollOnUrl();

    // Remove anchor highlight on click.
    useEffect(() => {
        // to assure propagation of click, which removes anchor highlight, work reliably
        // click listener has to be added on react container
        const parent = wrapperRef.current?.parentElement;
        const removeAnchor = () => anchor && dispatch(onAnchorChange());

        if (parent && anchor) {
            parent.addEventListener('click', removeAnchor);
            return () => parent.removeEventListener('click', removeAnchor);
        }
    }, [anchor, dispatch]);

    // Setting screens are available even if the device is not connected in normal mode
    // but then we need to hide NavigationBar so user can't navigate to Dashboard and Accounts.
    const isNavigationBarVisible = device?.mode === 'normal' && !initialRun;

    let sessionCount = 0;
    coinjoinAccounts.forEach(({ session }) => {
        if (session) {
            sessionCount++;
        }
    });

    const coinjoinStatusBars = useMemo(
        () =>
            coinjoinAccounts?.map(({ key, session }) => {
                if (!session) {
                    return;
                }

                return (
                    <CoinjoinStatusBar
                        accountKey={key}
                        session={session}
                        isSingle={sessionCount === 1}
                        key={key}
                    />
                );
            }),
        [coinjoinAccounts, sessionCount],
    );

    return (
        <Wrapper ref={wrapperRef}>
            <PageWrapper>
                <ModalContextProvider>
                    <Metadata title={title} />
                    <ModalSwitcher />

                    <SuiteBanners />
                    {coinjoinStatusBars}
                    {isNavigationBarVisible && isMobileLayout && <MobileNavigation />}

                    <DiscoveryProgress />

                    <LayoutContext.Provider value={setLayoutPayload}>
                        <Body data-test="@suite-layout/body">
                            <Columns>
                                {!isMobileLayout && <Sidebar />}

                                <AppWrapper data-test="@app" ref={scrollRef} id="layout-scroll">
                                    {isMobileLayout && <AccountsMenu isMenuInline />}
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
