import React from 'react';
import { WalletLayout } from '@wallet-components';
import { isTestnet } from '@suite-common/wallet-utils';
import { useSelector } from '@suite-hooks';

import { NoTokens } from './components/NoTokens';
import { TokenList } from './components/TokenList';

export const Tokens = () => {
    const { selectedAccount } = useSelector(state => state.wallet);

    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_TOKENS" account={selectedAccount} />;
    }

    const { account, network } = selectedAccount;
    const explorerUrl =
        network.networkType === 'cardano' ? network.explorer.token : network.explorer.account;

    return (
        <WalletLayout title="TR_TOKENS" account={selectedAccount} showEmptyHeaderPlaceholder>
            <TokenList
                isTestnet={isTestnet(account.symbol)}
                explorerUrl={explorerUrl}
                tokens={account.tokens}
                networkType={account.networkType}
            />
            {!account.tokens?.length && <NoTokens />}
        </WalletLayout>
    );
};

export default Tokens;
