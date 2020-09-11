import React from 'react';
import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import { WalletLayout, CoinmarketLayout } from '@wallet-components';
import { ComponentProps, Props } from '@wallet-types/coinmarketOffers';
import { CoinmarketOffersContext, useOffers } from '@wallet-hooks/useCoinmarketOffers';
import Offers from './Offers';

const mapStateToProps = (state: AppState): ComponentProps => ({
    selectedAccount: state.wallet.selectedAccount,
    device: state.suite.device,
    quotes: state.wallet.coinmarket.buy.quotes,
    alternativeQuotes: state.wallet.coinmarket.buy.alternativeQuotes,
    quotesRequest: state.wallet.coinmarket.buy.quotesRequest,
    isFromRedirect: state.wallet.coinmarket.buy.isFromRedirect,
    addressVerified: state.wallet.coinmarket.buy.addressVerified,
    providersInfo: state.wallet.coinmarket.buy.buyInfo?.providerInfos,
});

const OffersIndex = (props: Props) => {
    const { selectedAccount } = props;
    if (props.selectedAccount.status !== 'loaded') {
        return <WalletLayout title="Coinmarket | buy" account={selectedAccount} />;
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const coinmarketOffersValues = useOffers({ ...props, selectedAccount });

    return (
        <CoinmarketLayout>
            <CoinmarketOffersContext.Provider value={coinmarketOffersValues}>
                <Offers />
            </CoinmarketOffersContext.Provider>
        </CoinmarketLayout>
    );
};

// @ts-ignore
export default connect(mapStateToProps)(OffersIndex);
