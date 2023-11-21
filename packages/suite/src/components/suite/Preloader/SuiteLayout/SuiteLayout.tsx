import { useEffect, useRef, useState, ReactNode } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { SuiteBanners } from 'src/components/suite/banners';
import { Metadata } from 'src/components/suite';
import { GuideRouter, GuideButton } from 'src/components/guide';
import {
    DESKTOP_HORIZONTAL_PADDINGS,
    MAX_WIDTH,
    MOBILE_HORIZONTAL_PADDINGS,
} from 'src/constants/suite/layout';
import { DiscoveryProgress } from 'src/components/wallet';
import { onAnchorChange } from 'src/actions/suite/routerActions';
import { useLayoutSize, useSelector, useDevice, useDispatch } from 'src/hooks/suite';
import { useGuide } from 'src/hooks/guide';
import { LayoutContext, LayoutContextPayload } from 'src/support/suite/LayoutContext';
import { ModalContextProvider } from 'src/support/suite/ModalContext';
import { ModalSwitcher } from '../../modals/ModalSwitcher/ModalSwitcher';
import { MenuSecondary } from './MenuSecondary';
import { NavigationBar } from './NavigationBar/NavigationBar';

const Wrapper = styled.div`
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

const Body = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden hidden;
`;

// AppWrapper and MenuSecondary creates own scrollbars independently
const Columns = styled.div`
    display: flex;
    flex-direction: row;
    flex: 1 0 100%;
    overflow: auto;
    padding: 0;
`;

const AppWrapper = styled.div`
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

const DefaultPaddings = styled.div`
    position: relative;
    display: flex;
    justify-content: center;
    flex: 1;
    width: 100%;
    max-width: ${MAX_WIDTH};
    padding: 24px ${DESKTOP_HORIZONTAL_PADDINGS} 90px ${DESKTOP_HORIZONTAL_PADDINGS};

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding: 24px ${MOBILE_HORIZONTAL_PADDINGS} 70px ${MOBILE_HORIZONTAL_PADDINGS};
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        padding-bottom: 90px; /* including the mobile app banner */
    }
`;

type SuiteLayoutProps = {
    children: ReactNode;
};

export const SuiteLayout = ({ children }: SuiteLayoutProps) => {
    const url = useSelector(state => state.router.url);
    const anchor = useSelector(state => state.router.anchor);
    const initialRun = useSelector(state => state.suite.flags.initialRun);
    const dispatch = useDispatch();

    const { isMobileLayout, layoutSize } = useLayoutSize();
    const { isGuideOpen, isModalOpen } = useGuide();
    const { device } = useDevice();

    const [{ title, SideMenu, TopMenu }, setLayoutPayload] = useState<LayoutContextPayload>({});

    const wrapperRef = useRef<HTMLDivElement>(null);
    const appWrapperRef = useRef<HTMLDivElement>(null);

    // Reset scroll position on url change.
    // note: if you want to remove anchor highlight on scroll. It has to be added here
    useEffect(() => {
        const { current } = appWrapperRef;

        if (!current) return;

        current.scrollTop = 0; // reset scroll position on url change
    }, [url]);

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

    // There are three layout configurations WRT the guide and menu:
    // - On XLARGE viewports menu, body and guide are displayed in three columns.
    // - On viewports wider than mobile but smaller than XLARGE body and menu are
    //   are displayed in two columns unless guide is open. In such case, it takes
    //   its own column and menu is inlined on top of body.
    // - On mobile viewports the guide is simply hidden and menu is inlined on top
    //   of body constantly.
    const isMenuInline = isMobileLayout || (layoutSize === 'LARGE' && isGuideOpen);

    // Setting screens are available even if the device is not connected in normal mode
    // but then we need to hide NavigationBar so user can't navigate to Dashboard and Accounts.
    const isNavigationBarVisible = device?.mode === 'normal' && !initialRun;

    const isGuideFullHeight = isMobileLayout || isModalOpen;

    return (
        <Wrapper ref={wrapperRef}>
            <PageWrapper>
                <ModalContextProvider>
                    <Metadata title={title} />
                    <SuiteBanners />

                    <ModalSwitcher />

                    {isNavigationBarVisible && <NavigationBar />}

                    <DiscoveryProgress />

                    <LayoutContext.Provider value={setLayoutPayload}>
                        <Body data-test="@suite-layout/body">
                            <Columns>
                                {!isMenuInline && SideMenu && (
                                    <MenuSecondary>
                                        <SideMenu />
                                    </MenuSecondary>
                                )}

                                <AppWrapper data-test="@app" ref={appWrapperRef} id="layout-scroll">
                                    {isMenuInline && SideMenu && <SideMenu isMenuInline />}
                                    {TopMenu && <TopMenu />}
                                    <DefaultPaddings>{children}</DefaultPaddings>
                                </AppWrapper>

                                {!isGuideFullHeight && <GuideRouter />}
                            </Columns>
                        </Body>
                    </LayoutContext.Provider>

                    {!isMobileLayout && <GuideButton />}
                </ModalContextProvider>
            </PageWrapper>
            {isGuideFullHeight && <GuideRouter />}
        </Wrapper>
    );
};
