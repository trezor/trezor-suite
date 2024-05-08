import styled from 'styled-components';
import { withSelectedAccountLoaded, WithSelectedAccountLoadedProps } from 'src/components/wallet';
import Detail from './Detail';
import {
    CoinmarketDetailContext,
    useCoinmarketDetail,
} from 'src/hooks/wallet/coinmarket/useCoinmarketDetail';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const DetailIndex = (props: WithSelectedAccountLoadedProps) => {
    const coinmarketDetailContext = useCoinmarketDetail({
        selectedAccount: props.selectedAccount,
        tradeType: 'buy',
    });

    return (
        <CoinmarketDetailContext.Provider value={coinmarketDetailContext}>
            <Wrapper>
                <Detail />
            </Wrapper>
        </CoinmarketDetailContext.Provider>
    );
};

export default withSelectedAccountLoaded(DetailIndex, {
    title: 'TR_NAV_BUY',
});
