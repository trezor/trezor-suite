import { type ReactNode } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { type TradingSellType, selectTradingComposedTransactionInfo } from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';
import { Paragraph } from '@trezor/components';

import { TradingSellDetailPaymentFailed } from './TradingSellDetailPaymentFailed';
import { TradingSellDetailPaymentSuccessful } from './TradingSellDetailPaymentSuccessful';
import { TradingSellDetailSidebar } from './TradingSellDetailSidebar';
import {
    type SellDetailStatusStep,
    getSellDetailHeaderMessages,
    getSellDetailProgress,
    getSellDetailStatusStep,
} from './utils';
import { useSelector } from '../../../../../hooks/suite';
import { useTradingDetailContext } from '../../../../../hooks/wallet/trading/useTradingDetail';
import { useTradingDetailMissingTradeRedirect } from '../../../../../hooks/wallet/trading/useTradingDetailMissingTradeRedirect';
import { type TradingGetCryptoQuoteAmountProps } from '../../../../../types/trading/trading';
import { TradingDetailLayout } from '../../common/TradingDetail/TradingDetailLayout';
import { TradingDetailProcessingStep } from '../../common/TradingDetail/TradingDetailProcessingStep';
import { TradingDetailProgress } from '../../common/TradingDetail/TradingDetailProgress';
import { TradingDetailSendingStep } from '../../common/TradingDetail/TradingDetailSendingStep';
import {
    getTradingDetailStepState,
    getTradingProviderName,
} from '../../common/TradingDetail/utils';

export const TradingSellDetailContent = () => {
    const accounts = useSelector(selectAccounts);
    const composedTransaction = useSelector(selectTradingComposedTransactionInfo);
    const { trade, info } = useTradingDetailContext<TradingSellType>();
    const { translationString } = useTranslation();

    const tradeStatus = trade?.data?.status || 'PENDING';
    const tradeStatusStep = getSellDetailStatusStep(tradeStatus);
    const progress = getSellDetailProgress(tradeStatus);

    const exchange = trade?.data?.exchange;
    const provider = exchange ? info?.providerInfos?.[exchange] : undefined;

    const sendAccount = accounts.find(account => account.key === trade?.sendAccountKey);

    useTradingDetailMissingTradeRedirect('sell', trade);

    if (!trade) {
        return null;
    }

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        amountInCrypto: trade.data.amountInCrypto,
        sendAmount: trade.data.fiatStringAmount ?? '',
        sendCurrency: trade.data.fiatCurrency,
        receiveAmount: trade.data.cryptoStringAmount ?? '',
        receiveCurrency: trade.data.cryptoCurrency,
        networkFee: composedTransaction?.composed?.fee,
    };

    const getContent = () => {
        const progressContent = (
            <TradingDetailProgress
                {...getSellDetailHeaderMessages(tradeStatus)}
                type={translationString('TR_TRADING_SELL').toLowerCase()}
            >
                <TradingDetailSendingStep
                    state={getTradingDetailStepState(progress, 'customerAction')}
                    account={sendAccount}
                    txId={trade.data.txid}
                    composedTransaction={composedTransaction}
                />
                <TradingDetailProcessingStep
                    state={getTradingDetailStepState(progress, 'providerProcessing')}
                    tradeType="sell"
                    trade={trade.data}
                    provider={provider}
                >
                    <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation
                            id="TR_SELL_DETAIL_PROCESSING_TEXT"
                            values={{ providerName: getTradingProviderName(provider) }}
                        />
                    </Paragraph>
                </TradingDetailProcessingStep>
            </TradingDetailProgress>
        );

        const contentByStatusStep: Record<SellDetailStatusStep, ReactNode> = {
            pending: progressContent,
            success: (
                <TradingSellDetailPaymentSuccessful
                    trade={trade.data}
                    account={sendAccount}
                    provider={provider}
                />
            ),
            error: (
                <TradingSellDetailPaymentFailed
                    trade={trade.data}
                    account={sendAccount}
                    provider={provider}
                />
            ),
        };

        return contentByStatusStep[tradeStatusStep];
    };

    return (
        <TradingDetailLayout
            tradeType="sell"
            tradeStatus={tradeStatus}
            statusStep={tradeStatusStep}
            provider={provider}
            tradeId={trade.data.id}
            quoteAmounts={quoteAmounts}
            country={trade.data.country}
            sidebar={
                <TradingSellDetailSidebar
                    sendAccount={sendAccount}
                    quoteAmounts={quoteAmounts}
                    paymentMethod={trade.data.paymentMethod}
                    paymentMethodName={trade.data.paymentMethodName}
                    date={trade.date}
                    orderId={trade.data.orderId}
                    provider={provider}
                    trade={trade.data}
                />
            }
        >
            {getContent()}
        </TradingDetailLayout>
    );
};
