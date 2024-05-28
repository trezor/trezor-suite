import { withSelectedAccountLoaded } from 'src/components/wallet';
import styled from 'styled-components';
import {
    CoinmarketExchangeOffersContext,
    useCoinmarketExchangeOffers,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketExchangeOffers';
import Offers from './Offers';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const OffersIndex = (props: UseCoinmarketProps) => {
    const coinmarketExchangeOffers = useCoinmarketExchangeOffers(props);

    return (
        <CoinmarketExchangeOffersContext.Provider value={coinmarketExchangeOffers}>
            <Wrapper>
                <Offers />
            </Wrapper>
        </CoinmarketExchangeOffersContext.Provider>
    );
};

export default withSelectedAccountLoaded(OffersIndex, {
    title: 'TR_NAV_EXCHANGE',
});
