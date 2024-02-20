import styled from 'styled-components';
import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from 'src/components/wallet';
import {
    useCoinmarketBuyDetail,
    CoinmarketBuyDetailContext,
} from 'src/hooks/wallet/useCoinmarketBuyDetail';
import Detail from './Detail';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const DetailIndex = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketBuyContextValues = useCoinmarketBuyDetail(props);

    return (
        <CoinmarketBuyDetailContext.Provider value={coinmarketBuyContextValues}>
            <Wrapper>
                <Detail />
            </Wrapper>
        </CoinmarketBuyDetailContext.Provider>
    );
};

export default withSelectedAccountLoaded(DetailIndex, {
    title: 'TR_NAV_BUY',
});
