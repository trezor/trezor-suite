import styled from 'styled-components';
import Detail from './Detail';
import { withSelectedAccountLoaded } from 'src/components/wallet';
import {
    CoinmarketDetailContext,
    useCoinmarketDetail,
} from 'src/hooks/wallet/coinmarket/useCoinmarketDetail';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const DetailIndex = (props: UseCoinmarketProps) => {
    const coinmarketDetailContext = useCoinmarketDetail({
        selectedAccount: props.selectedAccount,
        tradeType: 'sell',
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
    title: 'TR_NAV_SELL',
});
