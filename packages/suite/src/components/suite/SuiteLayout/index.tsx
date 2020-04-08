import React, { useState, createContext } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { colors, variables } from '@trezor/components';
import SuiteNotifications from '@suite-components/Notifications';
import Head from 'next/head';
import Menu from '@suite-components/Menu/Container';
import { AppState } from '@suite-types';
import MenuSecondary from '@suite-components/MenuSecondary';
import { DiscoveryProgress } from '@wallet-components';

const PageWrapper = styled.div`
    display: flex;
    flex: 1;
    min-height: 600px;
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
`;

const MaxWidthWrapper = styled.div<{ withMenu: boolean }>`
    max-width: ${variables.SCREEN_SIZE.XL};
    max-width: ${props => (props.withMenu ? '786px' : '1024px')};
    height: 100%;
`;

const mapStateToProps = (state: AppState) => ({
    layoutSize: state.resize.size,
});

interface LayoutContextI {
    title?: string;
    menu?: React.ReactNode;
    setLayout?: (title?: string, menu?: any) => void;
}

export const LayoutContext = createContext<LayoutContextI>({
    title: undefined,
    menu: undefined,
    setLayout: undefined,
});

type Props = ReturnType<typeof mapStateToProps> & {
    children?: React.ReactNode;
};

const SuiteLayout = (props: Props) => {
    const [title, setTitle] = useState<string | undefined>(undefined);
    const [menu, setMenu] = useState<any>(undefined);
    const setLayout = React.useCallback((newTitle: any, newMenu: any) => {
        setTitle(newTitle);
        setMenu(newMenu);
    }, []);

    return (
        <PageWrapper>
            <Head>
                <title>{title ? `${title} | Trezor Suite` : 'Trezor Suite'}</title>
            </Head>
            {props.layoutSize !== 'small' && <Menu />}

            <Body>
                <DiscoveryProgress />
                <SuiteNotifications />
                <LayoutContext.Provider value={{ title, menu, setLayout }}>
                    <Columns>
                        {menu && <MenuSecondary>{menu}</MenuSecondary>}
                        <AppWrapper>
                            <MaxWidthWrapper withMenu={!!menu}>{props.children}</MaxWidthWrapper>
                        </AppWrapper>
                    </Columns>
                </LayoutContext.Provider>
            </Body>
        </PageWrapper>
    );
};

export default connect(mapStateToProps)(SuiteLayout);
