import React, { useState, createContext, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';

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
import { useResetScroll } from './useResetScroll';
import { useAnchorRemoving } from './useAnchorRemoving';

const PageWrapper = styled.div`
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
const Columns = styled.div<{
    isModalOpen?: boolean;
    isGuideOpen?: boolean;
    isModalOpenLastChange?: boolean;
    isNarrow?: boolean;
}>`
    display: flex;
    flex-direction: row;
    flex: 1 0 100%;
    overflow: auto;
    padding: 0;

    ${({ isNarrow }) =>
        isNarrow &&
        css`
            padding-right: ${variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH};
            transition: all 0.3s;
        `}

    ${({ isModalOpenLastChange, isNarrow }) =>
        isModalOpenLastChange &&
        isNarrow &&
        css`
            transition: none;
        `}
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

const MaxWidthWrapper = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    height: 100%;
    max-width: ${MAX_WIDTH};
`;

const DefaultPaddings = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 24px 32px 90px 32px;

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        padding: 24px 16px 70px 16px;
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        padding-bottom: 50px;
    }
`;

interface MobileBodyProps {
    url: string;
    menu?: React.ReactNode;
    appMenu?: React.ReactNode;
}

interface NormalBodyProps extends MobileBodyProps {
    isMenuInline: boolean;
    isModalOpen?: boolean;
    isNarrow?: boolean;
    isModalOpenLastChange?: boolean;
}

interface LayoutContextI {
    title?: string;
    menu?: React.ReactNode;
    isMenuInline?: boolean;
    appMenu?: React.ReactNode;
    setLayout?: (title?: string, menu?: React.ReactNode, appMenu?: React.ReactNode) => void;
}

export const LayoutContext = createContext<LayoutContextI>({
    title: undefined,
    menu: undefined,
    isMenuInline: undefined,
    appMenu: undefined,
    setLayout: undefined,
});

const BodyNormal: React.FC<NormalBodyProps> = ({
    url,
    menu,
    appMenu,
    children,
    isNarrow,
    isMenuInline,
    isModalOpen,
    isModalOpenLastChange,
}) => (
    <Body data-test="@suite-layout/body">
        <Columns
            isModalOpen={isModalOpen}
            isModalOpenLastChange={isModalOpenLastChange}
            isNarrow={isNarrow}
        >
            {!isMenuInline && menu && <MenuSecondary>{menu}</MenuSecondary>}
            <AppWrapper ref={useResetScroll(url)} data-test="@app">
                {isMenuInline && menu}
                {appMenu}
                <DefaultPaddings>
                    <MaxWidthWrapper>{children}</MaxWidthWrapper>
                </DefaultPaddings>
            </AppWrapper>

            <GuidePanel />
        </Columns>
    </Body>
);

const BodyMobile: React.FC<MobileBodyProps> = ({ url, menu, appMenu, children }) => (
    <Body data-test="@suite-layout/body">
        <Columns>
            <AppWrapper ref={useResetScroll(url)} data-test="@app">
                {menu}
                {appMenu}
                <DefaultPaddings>{children}</DefaultPaddings>
            </AppWrapper>

            <GuidePanel />
        </Columns>
    </Body>
);

export const SuiteLayout: React.FC = ({ children }) => {
    const { url, anchor } = useSelector(state => ({
        url: state.router.url,
        anchor: state.router.anchor,
    }));

    const [isModalOpenLastChange, setIsModalOpenLastChange] = useState<boolean>(false);
    const [title, setTitle] = useState<string | undefined>(undefined);
    const [menu, setMenu] = useState<React.ReactNode>(undefined);
    const [appMenu, setAppMenu] = useState<React.ReactNode>(undefined);

    const { isMobileLayout, layoutSize } = useLayoutSize();
    const { isGuideOpen, isModalOpen, isGuideOnTop } = useGuide();
    const { device } = useDevice();

    // fixes problem of animated layout movement when guide was open and user opened a modal
    useEffect(() => setIsModalOpenLastChange(true), [isModalOpen]);
    useEffect(() => setIsModalOpenLastChange(false), [isGuideOpen]);

    const setLayout = useCallback<NonNullable<LayoutContextI['setLayout']>>(
        (newTitle, newMenu, newAppMenu) => {
            setTitle(newTitle);
            setMenu(newMenu);
            setAppMenu(newAppMenu);
        },
        [],
    );

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

    const pageWrapperRef = useAnchorRemoving(anchor);

    return (
        <PageWrapper ref={pageWrapperRef}>
            <Metadata title={title} />
            <SuiteBanners />

            {isNavigationBarVisible && <NavigationBar />}

            <DiscoveryProgress />

            <LayoutContext.Provider value={{ title, menu, isMenuInline, setLayout }}>
                {isMobileLayout ? (
                    <BodyMobile menu={menu} appMenu={appMenu} url={url}>
                        {children}
                    </BodyMobile>
                ) : (
                    <BodyNormal
                        isNarrow={isGuideOpen && isModalOpen && !isGuideOnTop}
                        isModalOpenLastChange={isModalOpenLastChange}
                        menu={menu}
                        appMenu={appMenu}
                        url={url}
                        isMenuInline={isMenuInline}
                    >
                        {children}
                    </BodyNormal>
                )}
            </LayoutContext.Provider>

            {!isMobileLayout && <GuideButton />}
        </PageWrapper>
    );
};
