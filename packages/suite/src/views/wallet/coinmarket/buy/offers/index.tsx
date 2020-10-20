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

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const OffersIndexLoaded = (props: Props) => {
    const { selectedAccount } = props;
    const coinmarketOffersValues = useOffers({ ...props, selectedAccount });

    return (
        <CoinmarketBuyOffersContext.Provider value={coinmarketOffersValues}>
            <Wrapper>
                <Offers />
            </Wrapper>
        </CoinmarketBuyOffersContext.Provider>
    );
};

const OffersIndex = (props: ComponentProps) => {
    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_BUY" account={selectedAccount} />;
    }
    return <OffersIndexLoaded {...props} selectedAccount={selectedAccount} />;
};

export default connect(mapStateToProps)(OffersIndex);
