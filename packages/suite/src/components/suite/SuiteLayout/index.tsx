import React, { useState, createContext, useEffect } from 'react';
import styled, { css } from 'styled-components';

import { variables } from '@trezor/components';
import SuiteBanners from '@suite-components/Banners';
import MenuSecondary from '@suite-components/MenuSecondary';
import { Metadata } from '@suite-components';
import { GuidePanel, GuideButton } from '@guide-components';
import { MAX_WIDTH } from '@suite-constants/layout';
import { DiscoveryProgress } from '@wallet-components';
import NavigationBar from '../NavigationBar';
import { useLayoutSize, useSelector, useDevice } from '@suite-hooks';
import { useGuide } from '@guide-hooks';

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
    guideOpen?: boolean;
    isModalOpenLastChange?: boolean;
}>`
    display: flex;
    flex-direction: row;
    flex: 1 0 100%;
    overflow: auto;
    padding: 0;

    ${props =>
        props.isModalOpen &&
        props.guideOpen &&
        css`
            padding-right: ${variables.LAYOUT_SIZE.GUIDE_PANEL_WIDTH};
        `}

    ${props =>
        props.isModalOpen &&
        css`
            transition: all 0.3s;
        `}

    ${props =>
        props.isModalOpenLastChange &&
        props.guideOpen &&
        props.isModalOpen &&
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

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
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

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 24px 16px 70px 16px;
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding-bottom: 50px;
    }
`;

interface MobileBodyProps {
    url: string;
    menu?: React.ReactNode;
    appMenu?: React.ReactNode;
    children?: React.ReactNode;
}

interface NormalBodyProps extends MobileBodyProps {
    isMenuInline: boolean;
    isModalOpen?: boolean;
    guideOpen?: boolean;
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

type ScrollAppWrapperProps = Pick<MobileBodyProps, 'url' | 'children'>;
// ScrollAppWrapper is mandatory to reset AppWrapper scroll position on url change, fix: issue #1658
const ScrollAppWrapper = ({ url, children }: ScrollAppWrapperProps) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const { current } = ref;
        if (!current) return;
        current.scrollTop = 0; // reset scroll position on url change
    }, [ref, url]);
    return <AppWrapper ref={ref}>{children}</AppWrapper>;
};

const BodyNormal = ({
    url,
    menu,
    appMenu,
    children,
    isMenuInline,
    isModalOpen,
    guideOpen,
    isModalOpenLastChange,
}: NormalBodyProps) => (
    <Body>
        <Columns
            isModalOpen={isModalOpen}
            guideOpen={guideOpen}
            isModalOpenLastChange={isModalOpenLastChange}
        >
            {!isMenuInline && menu && <MenuSecondary>{menu}</MenuSecondary>}
            <ScrollAppWrapper url={url}>
                {isMenuInline && menu}
                {appMenu}
                <DefaultPaddings>
                    <MaxWidthWrapper>{children}</MaxWidthWrapper>
                </DefaultPaddings>
            </ScrollAppWrapper>
            <GuidePanel />
        </Columns>
    </Body>
);

const BodyMobile = ({ url, menu, appMenu, children }: MobileBodyProps) => (
    <Body>
        <Columns>
            <ScrollAppWrapper url={url}>
                {menu}
                {appMenu}
                <DefaultPaddings>{children}</DefaultPaddings>
            </ScrollAppWrapper>
        </Columns>
    </Body>
);

const SuiteLayout: React.FC = ({ children }) => {
    const { isMobileLayout, layoutSize } = useLayoutSize();
    const { router } = useSelector(state => ({
        router: state.router,
    }));
    const { guideOpen, isModalOpen } = useGuide();

    // fixes problem of animated layout movement when guide was open and user opened a modal
    const [isModalOpenLastChange, setIsModalOpenLastChange] = useState<boolean>(false);
    useEffect(() => setIsModalOpenLastChange(true), [isModalOpen]);
    useEffect(() => setIsModalOpenLastChange(false), [guideOpen]);

    const [title, setTitle] = useState<string | undefined>(undefined);
    const [menu, setMenu] = useState<any>(undefined);
    // There are three layout configurations WRT the guide and menu:
    // - On XLARGE viewports menu, body and guide are displayed in three columns.
    // - On viewports wider than mobile but smaller than XLARGE body and menu are
    //   are displayed in two columns unless guide is open. In such case, it takes
    //   its own column and menu is inlined on top of body.
    // - On mobile viewports the guide is simply hidden and menu is inlined on top
    //   of body constantly.
    const isMenuInline = isMobileLayout || (layoutSize !== 'XLARGE' && guideOpen);
    const [appMenu, setAppMenu] = useState<any>(undefined);
    const setLayout = React.useCallback<NonNullable<LayoutContextI['setLayout']>>(
        (newTitle, newMenu, newAppMenu) => {
            setTitle(newTitle);
            setMenu(newMenu);
            setAppMenu(newAppMenu);
        },
        [],
    );

    const { device } = useDevice();
    // Setting screens are available even if the device is not connected in normal mode
    // but then we need to hide NavigationBar so user can't navigate to Dashboard and Accounts.
    const isNavigationBarVisible = device?.mode === 'normal';

    return (
        <PageWrapper>
            <Metadata title={title} />
            <SuiteBanners />
            <DiscoveryProgress />
            {isNavigationBarVisible && <NavigationBar />}
            <LayoutContext.Provider value={{ title, menu, isMenuInline, setLayout }}>
                {!isMobileLayout && (
                    <BodyNormal
                        guideOpen={guideOpen}
                        isModalOpen={isModalOpen}
                        isModalOpenLastChange={isModalOpenLastChange}
                        menu={menu}
                        appMenu={appMenu}
                        url={router.url}
                        isMenuInline={isMenuInline}
                    >
                        {children}
                    </BodyNormal>
                )}
                {isMobileLayout && (
                    <BodyMobile menu={menu} appMenu={appMenu} url={router.url}>
                        {children}
                    </BodyMobile>
                )}
            </LayoutContext.Provider>
            <GuideButton />
        </PageWrapper>
    );
};

export default SuiteLayout;
