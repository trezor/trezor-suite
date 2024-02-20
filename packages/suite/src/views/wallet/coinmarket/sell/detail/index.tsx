import {
    useCoinmarketSellDetail,
    CoinmarketSellDetailContext,
} from 'src/hooks/wallet/useCoinmarketSellDetail';
import styled from 'styled-components';
import Detail from './Detail';
import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from 'src/components/wallet';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const DetailIndex = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketSellContextValues = useCoinmarketSellDetail(props);

    return (
        <CoinmarketSellDetailContext.Provider value={coinmarketSellContextValues}>
            <Wrapper>
                <Detail />
            </Wrapper>
        </CoinmarketSellDetailContext.Provider>
    );
};

export default withSelectedAccountLoaded(DetailIndex, {
    title: 'TR_NAV_SELL',
});
