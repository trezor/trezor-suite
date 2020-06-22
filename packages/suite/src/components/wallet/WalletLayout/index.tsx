import React from 'react';
import styled from 'styled-components';
import { LayoutContext } from '@suite-components';
import { AccountsMenu } from '@wallet-components';
import AccountLoader from './components/AccountLoader';
import Exception from '@wallet-components/AccountException';
import AccountMode from '@wallet-components/AccountMode';
import AccountAnnouncement from '@wallet-components/AccountAnnouncement';
import AccountTopPanel from '@wallet-components/AccountTopPanel';
import { MAX_WIDTH } from '@suite-constants/layout';
import { AppState } from '@suite-types';
import { variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    margin: 0 auto;
    flex-direction: column;
    padding: 0px 32px 32px 32px;
    width: 100%;
    max-width: ${MAX_WIDTH};
    height: 100%;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 0px 16px 16px 16px;
    }
`;

type Props = {
    title?: string;
    children?: React.ReactNode;
    account: AppState['wallet']['selectedAccount'];
};

const WalletLayout = (props: Props) => {
    const { setLayout } = React.useContext(LayoutContext);
    React.useMemo(() => {
        if (setLayout)
            setLayout(
                props.title || 'Trezor Suite | Wallet',
                <AccountsMenu />,
                <AccountTopPanel />,
            );
    }, [props.title, setLayout]);
    const { account } = props;

    if (account.status === 'loading') {
        return (
            <Wrapper>
                <AccountLoader type={account.loader} />
            </Wrapper>
        );
    }

    if (account.status === 'exception') {
        return (
            <Wrapper>
                <AccountMode mode={account.mode} />
                <AccountAnnouncement selectedAccount={account} />
                <Exception account={account} />
            </Wrapper>
        );
    }

    // if (account.imported) {
    // TODO
    // }

    return (
        <Wrapper>
            <AccountMode mode={account.mode} />
            <AccountAnnouncement selectedAccount={account} />
            {/* <WalletNotifications /> */}
            {props.children}
        </Wrapper>
    );
};

export default WalletLayout;
