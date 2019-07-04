import React from 'react';
import { AppState } from '@suite-types/index';
import Content from '@wallet-components/Content';
import LayoutAccount from '@wallet-components/LayoutAccount';
import Tokens from './components/Tokens';
import AccountHeader from './components/AccountHeader';

interface Props {
    selectedAccount: AppState['wallet']['selectedAccount'];
    summary: AppState['wallet']['summary'];
    wallet: AppState['wallet'];
    device: AppState['suite']['device'];
    tokens: AppState['wallet']['tokens'];
    fiat: AppState['wallet']['fiat'];
    localStorage: AppState['wallet']['localStorage'];
    // addToken: typeof TokenActions.add,
    // loadTokens: typeof TokenActions.load,
    // removeToken: typeof TokenActions.remove,
}

const AccountSummary = (props: Props) => {
    const { device } = props;
    const { account, network, tokens, pending, shouldRender } = props.selectedAccount;

    if (!device || !account || !network || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return <Content loader={loader} exceptionPage={exceptionPage} isLoading />;
    }

    return (
        <LayoutAccount>
            <AccountHeader
                account={account}
                network={network}
                pending={pending}
                fiatRates={props.fiat}
                localCurrency={props.wallet.settings.localCurrency}
                isHidden={props.wallet.settings.hideBalance}
            />
            {network.type === 'ethereum' ? (
                <Tokens
                    account={account}
                    loadTokens={props.loadTokens}
                    addToken={props.addToken}
                    removeToken={props.removeToken}
                    tokens={tokens}
                    pending={pending}
                    isBalanceHidden={props.wallet.settings.hideBalance}
                />
            ) : null}
        </LayoutAccount>
    );
};

export default AccountSummary;
