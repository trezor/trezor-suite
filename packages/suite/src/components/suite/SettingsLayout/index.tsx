import React from 'react';
import styled from 'styled-components';
import WalletNotifications from '@wallet-components/Notifications';
import { SuiteLayout } from '@suite-components';

interface Props {
    children?: React.ReactNode;
}

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    margin: 0 auto;
    width: 100%;
    max-width: 800px;
    padding: 20px 35px 40px 35px;
`;

const Layout = styled.div`
    display: flex;
    width: 100%;
    max-width: 1170px;
    flex-direction: column;
`;

const SettingsLayout = (props: Props) => {
    return (
        <SuiteLayout showSuiteHeader disableSidebar>
            <Layout>
                <WalletNotifications />
                <Wrapper>{props.children}</Wrapper>
            </Layout>
        </SuiteLayout>
    );
};

export default SettingsLayout;
