import React from 'react';
import styled from 'styled-components';
import { SuiteLayout } from '@suite-components';
import { Menu } from '@wallet-components';
import Loading from './components/Loading';
import Exception from '@wallet-components/AccountException';
import AccountMode from '@wallet-components/AccountMode';
import AccountAnnouncement from '@wallet-components/AccountAnnouncement';
import { AppState } from '@suite-types';

const Wrapper = styled.div<{ noPadding?: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 0px 32px 32px 32px;
    padding-top: ${props => (props.noPadding ? '8px' : '16px')};
    max-width: 1024px;
    height: 100%;
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
                <Loading type={account.loader} />
            </SuiteLayout>
        );
    }

    if (account.status === 'exception') {
        return (
            <SuiteLayout title={title} secondaryMenu={<Menu />}>
                <AccountMode mode={account.mode} />
                <AccountAnnouncement selectedAccount={account} />
                <Wrapper noPadding={!!account.mode}>
                    <Exception account={account} />
                </Wrapper>
            </SuiteLayout>
        );
    }

    // if (account.imported) {
    // TODO
    // }

    return (
        <SuiteLayout title={title} secondaryMenu={<Menu />}>
            <AccountMode mode={account.mode} />
            <AccountAnnouncement selectedAccount={account} />
            <Wrapper noPadding={!!account.mode}>
                {/* <WalletNotifications /> */}
                {props.children}
            </Wrapper>
        </SuiteLayout>
    );
};

export default WalletLayout;
