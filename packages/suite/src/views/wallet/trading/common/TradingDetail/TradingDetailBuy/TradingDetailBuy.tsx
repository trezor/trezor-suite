import { useEffect } from 'react';
import { usePrevious } from 'react-use';

import { BuyTradeStatus } from 'invity-api';
import styled from 'styled-components';

import { type TradingBuyType, selectTradingComposedTransactionInfo } from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { Box, BulletList, Card, Column, H3, Paragraph } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { TradingDetailBuyPaymentFailed } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentFailed';
import { TradingDetailBuyPaymentProcessingStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentProcessingStep';
import { TradingDetailBuyPaymentPaymentSuccessful } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentSuccessful';
import { TradingDetailBuyPaymentWaitingForUserStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailBuy/TradingDetailBuyPaymentWaitingForUserStep';
import { TradingDetailFeedback } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailFeedback';
import { TradingSelectedOfferInfo } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingSelectedOfferInfo';
import { TradingWrapper } from 'src/views/wallet/trading/common/TradingWrapper';

import { TradingDetailStepList } from '../TradingDetailStepList';

const Wrapper = styled.div`
    ${TradingWrapper}
`;

const getTradeStatusStep = (tradeStatus?: BuyTradeStatus) => {
    switch (tradeStatus) {
        case 'SUBMITTED':
        case 'WAITING_FOR_USER':
            return 'waiting';
        case 'APPROVAL_PENDING':
            return 'processing';
        case 'SUCCESS':
            return 'success';
        case 'ERROR':
        case 'BLOCKED':
            return 'error';
        default:
            return undefined;
    }
};

export const TradingDetailBuy = () => {
    const accounts = useSelector(selectAccounts);
    const { trade, info, account } = useTradingDetailContext<TradingBuyType>();
    const dispatch = useDispatch();

    const tradeStatus = trade?.data?.status;
    const previousTradeStatus = usePrevious(tradeStatus);
    const tradeStatusStep = getTradeStatusStep(tradeStatus);
    const composedTransaction = useSelector(selectTradingComposedTransactionInfo);

    const exchange = trade?.data?.exchange;
    const provider =
        info && info.providerInfos && exchange ? info.providerInfos[exchange] : undefined;
    const supportUrlTemplate = provider?.statusUrl || provider?.supportUrl;
    const supportUrl = supportUrlTemplate?.replace('{{paymentId}}', trade?.data?.paymentId || '');

    const country = trade?.data?.country;

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        amountInCrypto: trade?.data?.wantCrypto,
        sendAmount: trade?.data?.fiatStringAmount ?? '',
        sendCurrency: trade?.data?.fiatCurrency,
        receiveAmount: trade?.data?.receiveStringAmount ?? '',
        receiveCurrency: trade?.data?.receiveCurrency,
        networkFee: composedTransaction?.composed?.fee,
    };

    const receiveAccount = accounts.find(account => account.key === trade?.receiveAccountKey);

    useEffect(() => {
        // if tradeStatus hasn't changed, don't send the analytics event
        // also safeguard the initial tradeStatus change from undefined to defined
        if (!previousTradeStatus || previousTradeStatus === tradeStatus || !tradeStatusStep) {
            return;
        }

        analytics.report({
            type: EventType.TradingStatus,
            payload: {
                type: 'buy',
                status: tradeStatusStep,
            },
        });
    }, [tradeStatus, previousTradeStatus, tradeStatusStep]);

    // if trade not found, it is because user refreshed the page and stored transactionId got removed
    // go to the default trading page, the trade is shown there in the previous trades
    if (!trade) {
        dispatch(
            goto('wallet-trading-buy', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        return null;
    }

    const getContent = () => {
        switch (tradeStatusStep) {
            case 'success':
                return (
                    <TradingDetailBuyPaymentPaymentSuccessful
                        account={account}
                        trade={trade.data}
                        provider={provider}
                    />
                );
            case 'error':
                return (
                    <TradingDetailBuyPaymentFailed
                        account={account}
                        trade={trade.data}
                        provider={provider}
                        supportUrl={supportUrl}
                    />
                );
            default:
                return (
                    <>
                        <H3>
                            <Translation id="TR_BUY_HEADING" />
                        </H3>
                        <Paragraph typographyStyle="hint" variant="tertiary">
                            <Translation id="TR_BUY_HEADING_DESCRIPTION" />
                        </Paragraph>
                        <Box margin={{ top: 32, bottom: 12 }}>
                            <TradingDetailStepList>
                                <TradingDetailBuyPaymentWaitingForUserStep
                                    trade={trade.data}
                                    account={account}
                                    providerName={provider?.brandName || provider?.companyName}
                                />
                                <TradingDetailBuyPaymentProcessingStep
                                    trade={trade.data}
                                    provider={provider}
                                    supportUrl={supportUrl}
                                />
                                <BulletList.Item
                                    state="pending"
                                    title={<Translation id="TR_BUY_COMPLETE" />}
                                />
                            </TradingDetailStepList>
                        </Box>
                    </>
                );
        }
    };

    return (
        <Wrapper data-testid="@trading/transaction/detail">
            <Column gap={spacings.lg}>
                <Card paddingType="large" data-testid="@trading/transaction/detail/status-card">
                    {getContent()}
                </Card>
                <TradingDetailFeedback
                    status={tradeStatus}
                    type={trade.tradeType}
                    provider={provider?.name}
                    id={trade.data.id}
                    quoteAmounts={quoteAmounts}
                    country={country}
                />
            </Column>
            <Card>
                <TradingSelectedOfferInfo
                    account={account}
                    selectedAccount={receiveAccount}
                    selectedQuote={trade.data}
                    transactionId={trade.key}
                    providers={info?.providerInfos}
                    quoteAmounts={quoteAmounts}
                    type="buy"
                    paymentMethod={trade.data.paymentMethod}
                    paymentMethodName={trade.data.paymentMethodName}
                />
            </Card>
        </Wrapper>
    );
};
