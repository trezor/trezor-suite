import React, { useState } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import SuiteBanners from '@suite-components/Banners';
import MenuSecondary from '@suite-components/MenuSecondary';
import { Metadata } from '@suite-components';
import { GuidePanel, GuideButton } from '@guide-components';
import { MAX_WIDTH } from '@suite-constants/layout';
import { DiscoveryProgress } from '@wallet-components';
import { NavigationBar } from '../NavigationBar';
import { useLayoutSize, useSelector, useDevice } from '@suite-hooks';
import { useGuide } from '@guide-hooks';
import { ModalContextProvider } from '@suite-support/ModalContext';
import { ModalSwitcher } from '../ModalSwitcher/ModalSwitcher';
import { LayoutContext, LayoutContextPayload } from './LayoutContext';
import { useResetScroll } from './useResetScroll';
import { useAnchorRemoving } from './useAnchorRemoving';

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
    overflow-y: hidden;
    overflow-x: hidden;
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
    color: ${props => props.theme.TYPE_DARK_GREY};
    background: ${props => props.theme.BG_GREY};
    flex-direction: column;
    overflow-x: auto;
    overflow-y: scroll;
    width: 100%;
    align-items: center;
    position: relative;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        overflow-x: hidden;
    }
`;

const DefaultPaddings = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    max-width: ${MAX_WIDTH};
    padding: 24px 32px 90px 32px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding: 24px 16px 70px 16px;
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        padding-bottom: 50px;
    }
`;

type SuiteLayoutProps = {
    children: React.ReactNode;
};

export const SuiteLayout = ({ children }: SuiteLayoutProps) => {
    const { url, anchor } = useSelector(state => ({
        url: state.router.url,
        anchor: state.router.anchor,
    }));

    const { isMobileLayout, layoutSize } = useLayoutSize();
    const { isGuideOpen, isModalOpen } = useGuide();
    const { device } = useDevice();

    const [{ title, SideMenu, TopMenu }, setLayoutPayload] = useState<LayoutContextPayload>({});

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
    const isNavigationBarVisible = device?.mode === 'normal';

    const isGuideFullHeight = isMobileLayout || isModalOpen;

    const wrapperRef = useAnchorRemoving(anchor);
    const appWrapperRef = useResetScroll(url);

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

                                <AppWrapper data-test="@app" ref={appWrapperRef}>
                                    {isMenuInline && SideMenu && <SideMenu isMenuInline />}
                                    {TopMenu && <TopMenu />}
                                    <DefaultPaddings>{children}</DefaultPaddings>
                                </AppWrapper>

                                {!isGuideFullHeight && <GuidePanel />}
                            </Columns>
                        </Body>
                    </LayoutContext.Provider>

                    {!isMobileLayout && <GuideButton />}
                </ModalContextProvider>
            </PageWrapper>
            {isGuideFullHeight && <GuidePanel />}
        </Wrapper>
    );
};
