import styled from 'styled-components';
import { Card, variables } from '@trezor/components';
import { useCoinmarketBuyDetailContext } from 'src/hooks/wallet/useCoinmarketBuyDetail';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useLayout } from 'src/hooks/suite';
import { PageHeader } from 'src/components/suite/Preloader/SuiteLayout/PageHeader/PageHeader';
import { CoinmarketBuyOfferInfo } from '../../components/CoinmarketBuyOfferInfo';
import PaymentFailed from '../components/PaymentFailed';
import PaymentProcessing from '../components/PaymentProcessing';
import PaymentSuccessful from '../components/PaymentSuccessful';
import WaitingForUser from '../components/WaitingForUser';

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
    useLayout('Trezor Suite | Trade', () => <PageHeader backRoute="wallet-coinmarket-buy" />);

    const { account, trade, buyInfo } = useCoinmarketBuyDetailContext();
    const dispatch = useDispatch();

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default coinmarket page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(
            goto('wallet-coinmarket-buy', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
        return null;
    }

    const tradeStatus = trade?.data?.status;
    const showError = tradeStatus === 'ERROR' || tradeStatus === 'BLOCKED';
    const showProcessing = tradeStatus === 'APPROVAL_PENDING';
    const showWaiting = tradeStatus === 'SUBMITTED' || tradeStatus === 'WAITING_FOR_USER';
    const showSuccess = tradeStatus === 'SUCCESS';

    const exchange = trade?.data?.exchange;
    const provider =
        buyInfo && buyInfo.providerInfos && exchange ? buyInfo.providerInfos[exchange] : undefined;
    const supportUrlTemplate = provider?.statusUrl || provider?.supportUrl;
    const supportUrl = supportUrlTemplate?.replace('{{paymentId}}', trade?.data?.paymentId || '');

    return (
        <Wrapper>
            <StyledCard>
                {showError && <PaymentFailed account={account} supportUrl={supportUrl} />}
                {showProcessing && <PaymentProcessing />}
                {showWaiting && (
                    <WaitingForUser
                        trade={trade.data}
                        account={account}
                        providerName={provider?.companyName}
                    />
                )}
                {showSuccess && <PaymentSuccessful account={account} />}
            </StyledCard>
            <CoinmarketBuyOfferInfo
                account={account}
                selectedQuote={trade.data}
                transactionId={trade.key}
                providers={buyInfo?.providerInfos}
            />
        </Wrapper>
    );
};

export default CoinmarketDetail;
