import React, { useState, createContext } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { colors, variables } from '@trezor/components';
import SuiteNotifications from '@suite-components/Notifications';
import Head from 'next/head';
import { AppState } from '@suite-types';
import { BetaBadge } from '@suite-components';
import MenuSecondary from '@suite-components/MenuSecondary';
import { MAX_WIDTH } from '@suite-constants/layout';
import { DiscoveryProgress } from '@wallet-components';
import NavigationBar from '../NavigationBar';
import { useLayoutSize } from '@suite-hooks';

const PageWrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100vh;
    overflow-x: hidden;
`;

const Body = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    flex: 1 1 0%;
    overflow: auto;
    height: 100vh;
`;

// AppWrapper and MenuSecondary creates own scrollbars independently
const Columns = styled.div`
    display: flex;
    flex-direction: row;
    overflow: hidden;
    height: 100%;
`;

const AppWrapper = styled.div`
    display: flex;
    background: ${colors.BACKGROUND};
    flex-direction: column;
    overflow: auto;
    flex: 1 1 0%;
    align-items: center;
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
    layoutSize: state.resize.size,
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

// ScrollAppWrapper is mandatory to reset AppWrapper scroll position on url change, fix: issue #1658
const ScrollAppWrapper = ({ url, children }: BodyProps) => {
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

const SuiteLayout = (props: Props) => {
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
            <Head>
                <title>{title ? `${title} | Trezor Suite` : 'Trezor Suite'}</title>
            </Head>
            <SuiteNotifications />
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
