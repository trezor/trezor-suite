import React from 'react';
import styled from 'styled-components';
import { WalletLayout } from '@wallet-components';
import { useSelector } from '@suite-hooks';
import { CoinmarketBuyOffersContext, useOffers } from '@wallet-hooks/useCoinmarketBuyOffers';
import Offers from './Offers';
import type { Props } from '@wallet-types/coinmarketBuyOffers';

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

const OffersIndex = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        device: state.suite.device,
        quotes: state.wallet.coinmarket.buy.quotes,
        alternativeQuotes: state.wallet.coinmarket.buy.alternativeQuotes,
        quotesRequest: state.wallet.coinmarket.buy.quotesRequest,
        isFromRedirect: state.wallet.coinmarket.buy.isFromRedirect,
        addressVerified: state.wallet.coinmarket.buy.addressVerified,
        providersInfo: state.wallet.coinmarket.buy.buyInfo?.providerInfos,
    }));
    if (props.selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_BUY" account={props.selectedAccount} />;
    }
    return <OffersIndexLoaded {...props} selectedAccount={props.selectedAccount} />;
};

export default OffersIndex;
