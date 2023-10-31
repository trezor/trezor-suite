import styled from 'styled-components';
import { variables } from '@trezor/components';
import { useCoinmarketLayout } from 'src/hooks/wallet/useCoinmarketLayout';
import { CoinmarketP2pOffersContext, useOffers } from 'src/hooks/wallet/useCoinmarketP2pOffers';
import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from 'src/components/wallet';
import { CoinmarketFooter, CoinmarketP2pTopPanel } from 'src/views/wallet/coinmarket/common';
import { List } from 'src/views/wallet/coinmarket/p2p/offers/List';
import { SelectedOffer } from 'src/views/wallet/coinmarket/p2p/offers/SelectedOffer';

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
