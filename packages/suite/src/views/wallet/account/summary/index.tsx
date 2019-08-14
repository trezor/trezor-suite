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
    const { device } = props;
    const { account, network, discovery, shouldRender } = props.wallet.selectedAccount;

    if (!device || !account || !discovery || !network || !shouldRender) {
        const { loader, exceptionPage } = props.wallet.selectedAccount;
        return <Content loader={loader} exceptionPage={exceptionPage} isLoading />;
    }

    return (
        <LayoutAccount>
            <AccountHeader
                account={account}
                network={network}
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
                    tokens={[]}
                    pending={[]}
                    isBalanceHidden={props.wallet.settings.hideBalance}
                />
            ) : null}
        </LayoutAccount>
    );
};

export default AccountSummary;
