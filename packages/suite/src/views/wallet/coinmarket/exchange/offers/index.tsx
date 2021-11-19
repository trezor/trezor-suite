import React from 'react';
import { WalletLayout } from '@wallet-components';
import { useSelector } from '@suite-hooks';
import styled from 'styled-components';
import { Props } from '@wallet-types/coinmarketExchangeOffers';
import {
    CoinmarketExchangeOffersContext,
    useOffers,
} from '@wallet-hooks/useCoinmarketExchangeOffers';
import Offers from './Offers';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const OffersIndexLoaded = (props: Props) => {
    const { selectedAccount } = props;
    const coinmarketOffersValues = useOffers({ ...props, selectedAccount });

    return (
        <CoinmarketExchangeOffersContext.Provider value={coinmarketOffersValues}>
            <Wrapper>
                <Offers />
            </Wrapper>
        </CoinmarketExchangeOffersContext.Provider>
    );
};

const OffersIndex = () => {
    const props = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        device: state.suite.device,
        fixedQuotes: state.wallet.coinmarket.exchange.fixedQuotes,
        floatQuotes: state.wallet.coinmarket.exchange.floatQuotes,
        dexQuotes: state.wallet.coinmarket.exchange.dexQuotes,
        quotesRequest: state.wallet.coinmarket.exchange.quotesRequest,
        addressVerified: state.wallet.coinmarket.exchange.addressVerified,
        exchangeInfo: state.wallet.coinmarket.exchange.exchangeInfo,
    }));

    const { selectedAccount } = props;
    if (selectedAccount.status !== 'loaded') {
        return <WalletLayout title="TR_NAV_EXCHANGE" account={selectedAccount} />;
    }
    return <OffersIndexLoaded {...props} selectedAccount={selectedAccount} />;
};

export default OffersIndex;
