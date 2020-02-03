import React from 'react';
import styled from 'styled-components';
import { SuiteLayout } from '@suite-components';
import { Menu, DiscoveryProgress } from '@wallet-components';
import Loading from './components/Loading';
import Exception from '@wallet-components/AccountException';
import AccountMode from '@wallet-components/AccountMode';
import AccountAnnouncement from '@wallet-components/AccountAnnouncement';
import { AppState } from '@suite-types';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 40px 35px 40px 35px;
    max-width: 1024px;
`;

type Props = {
    title?: string;
    children?: React.ReactNode;
    account: AppState['wallet']['selectedAccount'];
};

const WalletLayout = (props: Props) => {
    const { account } = props;
    const title = props.title || 'Trezor Suite | Wallet';

    if (account.status === 'loading') {
        return (
            <SuiteLayout title={title} secondaryMenu={<Menu />}>
                <Wrapper>
                    <Loading type={account.loader} />
                </Wrapper>
            </SuiteLayout>
        );
    }

    if (account.status === 'exception') {
        return (
            <SuiteLayout title={title} secondaryMenu={<Menu />}>
                <DiscoveryProgress />
                <AccountMode mode={account.mode} />
                <AccountAnnouncement selectedAccount={account} />
                <Wrapper>
                    <Exception account={account} />
                </Wrapper>
            </SuiteLayout>
        );
    }

    return (
        <SuiteLayout title={title} secondaryMenu={<Menu />}>
            <DiscoveryProgress />
            <AccountMode mode={account.mode} />
            <AccountAnnouncement selectedAccount={account} />
            <Wrapper>
                {/* <WalletNotifications /> */}
                {props.children}
            </Wrapper>
        </SuiteLayout>
    );
};

export default WalletLayout;
