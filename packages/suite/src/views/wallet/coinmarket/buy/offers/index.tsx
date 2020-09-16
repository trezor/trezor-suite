import React from 'react';
import { connect } from 'react-redux';
import { AppState } from '@suite-types';
import { WalletLayout } from '@wallet-components';
import styled from 'styled-components';
import { ComponentProps, Props } from '@wallet-types/coinmarketBuyOffers';
import { CoinmarketBuyOffersContext, useOffers } from '@wallet-hooks/useCoinmarketBuyOffers';
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
        <CoinmarketBuyOffersContext.Provider value={coinmarketOffersValues}>
            <Wrapper>
                <Offers />
            </Wrapper>
        </CoinmarketBuyOffersContext.Provider>
    );
};

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

// @ts-ignore
export default connect(mapStateToProps)(OffersIndex);
