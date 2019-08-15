import React from 'react';
import Content from '@wallet-components/Content';
import LayoutAccount from '@wallet-components/LayoutAccount';
import * as TokenActions from '@wallet-actions/tokenActions';
import { findDeviceAccounts } from '@suite/reducers/wallet/accountsReducer';
import NETWORKS from '@suite-config/networks';
import Tokens from './components/Tokens';
import AccountHeader from './components/AccountHeader';
import { AppState } from '@suite-types';

interface Props {
    wallet: AppState['wallet'];
    device: AppState['suite']['device'];
    tokens: AppState['wallet']['tokens'];
    router: AppState['router'];
    fiat: AppState['wallet']['fiat'];
    addToken: typeof TokenActions.add;
    loadTokens: typeof TokenActions.load;
    removeToken: typeof TokenActions.remove;
}

const AccountSummary = (props: Props) => {
    // const { account, network, tokens, pending, shouldRender } = props.selectedAccount;
    const selectedCoin = props.router.params.coin;
    const { accountId } = props.router.params;
    const network = NETWORKS.find(n => n.shortcut === selectedCoin);
    if (!network) return null;

    const selectedAccount = findDeviceAccounts(props.wallet.accounts, selectedCoin).find(
        a => a.index === Number(accountId),
    );

    // if (!device || !account || !network || !shouldRender) {
    if (!selectedAccount) {
        // TODO: add message based on what is going on (or reimplement selectedAccount)
        // const { loader, exceptionPage } = props.selectedAccount;
        return (
            <LayoutAccount>
                <Content loader={{ message: 'loading' }} isLoading />
            </LayoutAccount>
        );
    }

    return (
        <LayoutAccount>
            <AccountHeader
                account={selectedAccount}
                network={network}
                fiatRates={props.fiat}
                localCurrency={props.wallet.settings.localCurrency}
                isHidden={props.wallet.settings.hideBalance}
            />
            {network.type === 'ethereum' ? (
                <Tokens
                    account={selectedAccount}
                    loadTokens={props.loadTokens}
                    addToken={props.addToken}
                    removeToken={props.removeToken}
                    tokens={[]}
                    pending={[]}
                    isBalanceHidden={props.wallet.settings.hideBalance}
                />
            ) : null}
        </LayoutAccount>
    );
};

export default AccountSummary;
