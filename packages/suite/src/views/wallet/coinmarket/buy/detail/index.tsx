import styled from 'styled-components';
import { withSelectedAccountLoaded } from 'src/components/wallet';
import Detail from './Detail';
import {
    CoinmarketDetailContext,
    useCoinmarketDetail,
} from 'src/hooks/wallet/coinmarket/useCoinmarketDetail';
import { UseCoinmarketProps } from 'src/types/coinmarket/coinmarket';
import { withCoinmarketLayoutWrap } from 'src/views/wallet/coinmarket/common/CoinmarketLayout/withCoinmarketLayoutWrap';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const DetailIndex = (props: UseCoinmarketProps) => {
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

export default withSelectedAccountLoaded(
    withCoinmarketLayoutWrap(DetailIndex, {
        backRoute: 'wallet-coinmarket-buy',
    }),
    {
        title: 'TR_NAV_BUY',
    },
);
