import { withSelectedAccountLoaded } from 'src/components/wallet';
import styled from 'styled-components';
import { useCoinmarketExchangeOffers } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketExchangeOffers';
import Offers from './Offers';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { CoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const OffersIndex = (props: UseCoinmarketProps) => {
    const coinmarketExchangeOffers = useCoinmarketExchangeOffers(props);

    return (
        <CoinmarketOffersContext.Provider value={coinmarketExchangeOffers}>
            <Wrapper>
                <Offers />
            </Wrapper>
        </CoinmarketOffersContext.Provider>
    );
};

export default withSelectedAccountLoaded(OffersIndex, {
    title: 'TR_NAV_EXCHANGE',
});
