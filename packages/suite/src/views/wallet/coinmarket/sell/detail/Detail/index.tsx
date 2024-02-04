import styled from 'styled-components';

import { Card, variables } from '@trezor/components';
import { useCoinmarketSellDetailContext } from 'src/hooks/wallet/useCoinmarketSellDetail';
import { SellFiatTradeFinalStatuses } from 'src/hooks/wallet/useCoinmarket';
import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useLayout } from 'src/hooks/suite';
import PaymentPending from '../components/PaymentPending';
import PaymentSuccessful from '../components/PaymentSuccessful';
import PaymentFailed from '../components/PaymentFailed';
import { CoinmarketSellOfferInfo } from '../../components/CoinmarketSellOfferInfo';

const Wrapper = styled.div`
    display: flex;
    margin-top: 20px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const StyledCard = styled(Card)`
    flex: 1;
    padding: 0;
`;

const CoinmarketDetail = () => {
    useLayout('Trezor Suite | Trade', () => <PageHeader backRoute="wallet-coinmarket-sell" />);

    const { account, trade, sellInfo } = useCoinmarketSellDetailContext();
    const dispatch = useDispatch();

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default coinmarket page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(
            goto('wallet-coinmarket-sell', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        return null;
    }

    const tradeStatus = trade?.data?.status || 'PENDING';

    const showPending = !SellFiatTradeFinalStatuses.includes(tradeStatus);

    const exchange = trade?.data?.exchange;
    const provider =
        sellInfo && sellInfo.providerInfos && exchange
            ? sellInfo.providerInfos[exchange]
            : undefined;
    const supportUrlTemplate = provider?.statusUrl || provider?.supportUrl;
    const supportUrl = supportUrlTemplate?.replace('{{orderId}}', trade?.data?.orderId || '');

    return (
        <Wrapper>
            <StyledCard>
                {tradeStatus === 'SUCCESS' && <PaymentSuccessful account={account} />}
                {SellFiatTradeFinalStatuses.includes(tradeStatus) && tradeStatus !== 'SUCCESS' && (
                    <PaymentFailed
                        account={account}
                        transactionId={trade.key}
                        supportUrl={supportUrl}
                    />
                )}
                {showPending && <PaymentPending supportUrl={supportUrl} />}
            </StyledCard>
            <CoinmarketSellOfferInfo
                account={account}
                providers={sellInfo?.providerInfos}
                selectedQuote={trade.data}
                transactionId={trade.key}
            />
        </Wrapper>
    );
};

export default CoinmarketDetail;
