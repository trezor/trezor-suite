import {
    useCoinmarketExchangeDetail,
    CoinmarketExchangeDetailContext,
} from 'src/hooks/wallet/useCoinmarketExchangeDetail';
import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from 'src/components/wallet';
import styled from 'styled-components';
import Detail from './Detail';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const DetailIndex = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketExchangeContextValues = useCoinmarketExchangeDetail(props);

    return (
        <CoinmarketExchangeDetailContext.Provider value={coinmarketExchangeContextValues}>
            <Wrapper>
                <Detail />
            </Wrapper>
        </CoinmarketExchangeDetailContext.Provider>
    );
};

export default withSelectedAccountLoaded(DetailIndex, {
    title: 'TR_NAV_EXCHANGE',
});
