import React, { useState, createContext } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { variables, scrollbarStyles } from '@trezor/components';
import SuiteBanners from '@suite-components/Banners';
import { AppState } from '@suite-types';
import { BetaBadge, Metadata } from '@suite-components';
import MenuSecondary from '@suite-components/MenuSecondary';
import { MAX_WIDTH, DESKTOP_TITLEBAR_HEIGHT } from '@suite-constants/layout';
import { DiscoveryProgress } from '@wallet-components';
import NavigationBar from '../NavigationBar';
import { useLayoutSize } from '@suite-hooks';
import { isDesktop } from '@suite-utils/env';

const PageWrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    height: ${isDesktop() ? `calc(100vh - ${DESKTOP_TITLEBAR_HEIGHT})` : '100vh'};
    overflow-x: hidden;
`;

const Body = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
`;

// AppWrapper and MenuSecondary creates own scrollbars independently
const Columns = styled.div`
    display: flex;
    flex-direction: row;
    flex: 1 0 100%;
    overflow: auto;
`;

const AppWrapper = styled.div`
    display: flex;
    color: ${props => props.theme.TYPE_DARK_GREY};
    background: ${props => props.theme.BG_GREY};
    flex-direction: column;
    overflow-x: auto;
    overflow-y: scroll;
    width: 100%;
    align-items: center;

    ${scrollbarStyles}
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

const mapStateToProps = (state: AppState) => ({
    router: state.router,
});

type Props = ReturnType<typeof mapStateToProps> & {
    children?: React.ReactNode;
};

interface BodyProps {
    url: string;
    menu?: React.ReactNode;
    appMenu?: React.ReactNode;
    children?: React.ReactNode;
}

interface LayoutContextI {
    title?: string;
    menu?: React.ReactNode;
    appMenu?: React.ReactNode;
    setLayout?: (title?: string, menu?: React.ReactNode, appMenu?: React.ReactNode) => void;
}

export const LayoutContext = createContext<LayoutContextI>({
    title: undefined,
    menu: undefined,
    appMenu: undefined,
    setLayout: undefined,
});

type ScrollAppWrapperProps = Pick<BodyProps, 'url' | 'children'>;
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

const BodyWide = ({ url, menu, appMenu, children }: BodyProps) => (
    <Body>
        <Columns>
            {menu && <MenuSecondary>{menu}</MenuSecondary>}
            <ScrollAppWrapper url={url}>
                {appMenu}
                <DefaultPaddings>
                    <MaxWidthWrapper>{children}</MaxWidthWrapper>
                </DefaultPaddings>
            </ScrollAppWrapper>
        </Columns>
    </Body>
);

const BodyNarrow = ({ url, menu, appMenu, children }: BodyProps) => (
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

type SuiteLayoutProps = Omit<Props, 'menu' | 'appMenu'>;
const SuiteLayout = (props: SuiteLayoutProps) => {
    // TODO: if (props.layoutSize === 'UNAVAILABLE') return <SmallLayout />;
    const { isMobileLayout } = useLayoutSize();
    const [title, setTitle] = useState<string | undefined>(undefined);
    const [menu, setMenu] = useState<any>(undefined);
    const [appMenu, setAppMenu] = useState<any>(undefined);
    const setLayout = React.useCallback<NonNullable<LayoutContextI['setLayout']>>(
        (newTitle, newMenu, newAppMenu) => {
            setTitle(newTitle);
            setMenu(newMenu);
            setAppMenu(newAppMenu);
        },
        [],
    );

    return (
        <PageWrapper>
            <Metadata title={title} />
            <SuiteBanners />
            <DiscoveryProgress />
            <NavigationBar />
            <LayoutContext.Provider value={{ title, menu, setLayout }}>
                {!isMobileLayout && (
                    <BodyWide menu={menu} appMenu={appMenu} url={props.router.url}>
                        {props.children}
                    </BodyWide>
                )}
                {isMobileLayout && (
                    <BodyNarrow menu={menu} appMenu={appMenu} url={props.router.url}>
                        {props.children}
                    </BodyNarrow>
                )}
            </LayoutContext.Provider>
            <BetaBadge />
        </PageWrapper>
    );
};

export default connect(mapStateToProps)(SuiteLayout);
