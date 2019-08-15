import React from 'react';
import Content from '@wallet-components/Content';
import LayoutAccount from '@wallet-components/LayoutAccount';
import * as TokenActions from '@wallet-actions/tokenActions';
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
    const { device } = props.suite;
    const { account, network, discovery, shouldRender } = props.wallet.selectedAccount;
    if (!device || !account || !network || !shouldRender) {
        const { loader, exceptionPage } = props.wallet.selectedAccount;
        return (
            <LayoutAccount>
                <Content loader={loader} exceptionPage={exceptionPage} isLoading />
            </LayoutAccount>
        );
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
        </LayoutAccount>
    );
};

export default AccountSummary;
