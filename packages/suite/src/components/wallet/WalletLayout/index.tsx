import React from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { Menu } from '@wallet-components';
import AccountLoader from './components/AccountLoader';
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
    const { setLayout } = React.useContext(LayoutContext);
    React.useMemo(() => {
        if (setLayout) setLayout(props.title || 'Trezor Suite | Wallet', <Menu />);
    }, [props.title, setLayout]);
    const { account } = props;

    if (account.status === 'loading') {
        return <AccountLoader type={account.loader} />;
    }

    if (account.status === 'exception') {
        return (
            <>
                <AccountMode mode={account.mode} />
                <AccountAnnouncement selectedAccount={account} />
                <Wrapper noPadding={!!account.mode}>
                    <Exception account={account} />
                </Wrapper>
            </>
        );
    }

    // if (account.imported) {
    // TODO
    // }

    return (
        <>
            <AccountMode mode={account.mode} />
            <AccountAnnouncement selectedAccount={account} />
            <Wrapper noPadding={!!account.mode}>
                {/* <WalletNotifications /> */}
                {props.children}
            </Wrapper>
        </>
    );
};

export default WalletLayout;
