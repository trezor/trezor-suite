import React from 'react';
import Content from '@wallet-components/Content';
import LayoutAccount from '@wallet-components/LayoutAccount';
import AccountHeader from './components/AccountHeader';
import { AppState } from '@suite-types';

interface Props {
    wallet: AppState['wallet'];
    suite: AppState['suite'];
    router: AppState['router'];
    fiat: AppState['wallet']['fiat'];
}

const AccountSummary = (props: Props) => {
    const { device } = props.suite;
    const { account, network, shouldRender } = props.wallet.selectedAccount;
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
