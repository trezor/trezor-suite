import React from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { useCoinmarketLayout } from '@wallet-hooks/useCoinmarketLayout';
import { CoinmarketP2pOffersContext, useOffers } from '@wallet-hooks/useCoinmarketP2pOffers';
import {
    CoinmarketFooter,
    CoinmarketP2pTopPanel,
    withSelectedAccountLoaded,
    WithSelectedAccountLoadedProps,
} from '@wallet-components';
import { List } from '@wallet-views/coinmarket/p2p/offers/List';
import { SelectedOffer } from '@wallet-views/coinmarket/p2p/offers/SelectedOffer';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    padding: 0 32px 32px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        padding: 16px;
    }

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        padding: 0;
    }
`;

const OffersIndex = (props: WithSelectedAccountLoadedProps) => {
    useCoinmarketLayout(CoinmarketP2pTopPanel);

    const coinmarketOffersValues = useOffers(props);
    const { quotes, selectedQuote } = coinmarketOffersValues;

    return (
        <CoinmarketP2pOffersContext.Provider value={coinmarketOffersValues}>
            <Wrapper>
                {quotes && !selectedQuote && <List quotes={quotes} />}
                {selectedQuote && <SelectedOffer />}
                <CoinmarketFooter />
            </Wrapper>
        </CoinmarketP2pOffersContext.Provider>
    );
};

export default withSelectedAccountLoaded(OffersIndex, {
    title: 'TR_NAV_P2P',
});
