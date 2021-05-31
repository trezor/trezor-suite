import React from 'react';
import { WalletLayout } from '@wallet-components';
import { isTestnet } from '@wallet-utils/accountUtils';
import { useSelector } from '@suite-hooks';
import { AppState } from '@suite-types';

import NoTokens from './components/NoTokens';
import TokenList from './components/TokenList';
import AccountEmpty from '../transactions/components/AccountEmpty';

interface ContentProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
}

const Content: React.FC<ContentProps> = ({ selectedAccount, children }) => {
    if (selectedAccount.status !== 'loaded') return null;
    const { account, network } = selectedAccount;

    return (
        <WalletLayout title="TR_TOKENS" account={selectedAccount} showEmptyHeaderPlaceholder>
            {account.networkType === 'ethereum' && (
                <TokenList
                    isTestnet={isTestnet(account.symbol)}
                    explorerUrl={network.explorer.account}
                    tokens={account.tokens}
                />
            )}
            {children}
        </WalletLayout>
    );
};

const Tokens = () => {
    const { selectedAccount } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
    }));

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_TOKENS" account={selectedAccount} />;
    }

    const { account } = selectedAccount;

    if (!account.tokens?.length) {
        return (
            <Content selectedAccount={selectedAccount}>
                <NoTokens />
            </Content>
        );
    }

    if (account.empty) {
        return (
            <Content selectedAccount={selectedAccount}>
                <AccountEmpty account={selectedAccount.account} />
            </Content>
        );
    }

    return <Content selectedAccount={selectedAccount} />;
};

export default Tokens;
