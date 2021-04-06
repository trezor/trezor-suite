import React from 'react';
import { useSelector } from '@suite-hooks';
import { WalletLayout } from '@wallet-components';
import styled from 'styled-components';
import { Props } from '@wallet-types/coinmarketSellOffers';
import { CoinmarketSellOffersContext, useOffers } from '@wallet-hooks/useCoinmarketSellOffers';
import Offers from './Offers';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const OffersIndexLoaded = (props: Props) => {
    const coinmarketOffersValues = useOffers(props);

    return (
        <CoinmarketSellOffersContext.Provider value={coinmarketOffersValues}>
            <Wrapper>
                <Offers />
            </Wrapper>
        </CoinmarketSellOffersContext.Provider>
    );
};

const OffersIndex = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        device: state.suite.device,
        quotes: state.wallet.coinmarket.sell.quotes,
        alternativeQuotes: state.wallet.coinmarket.sell.alternativeQuotes,
        quotesRequest: state.wallet.coinmarket.sell.quotesRequest,
        sellInfo: state.wallet.coinmarket.sell.sellInfo,
    }));

    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_SELL" account={selectedAccount} />;
    }
    return <OffersIndexLoaded {...props} selectedAccount={selectedAccount} />;
};

export default OffersIndex;
