import { useTranslation } from '@suite/intl';
import { type TradingBuyType, selectTradingComposedTransactionInfo } from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { useTradingDetailMissingTradeRedirect } from 'src/hooks/wallet/trading/useTradingDetailMissingTradeRedirect';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { TradingDetailLayout } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailLayout';
import { TradingDetailProcessingStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProcessingStep';
import { TradingDetailProgress } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProgress';
import {
    getTradingDetailStepState,
    getTradingProviderName,
} from 'src/views/wallet/trading/common/TradingDetail/utils';

import { TradingBuyDetailPaymentBanner } from './TradingBuyDetailPaymentBanner';
import { TradingBuyDetailPaymentFailed } from './TradingBuyDetailPaymentFailed';
import { TradingBuyDetailPaymentSuccessful } from './TradingBuyDetailPaymentSuccessful';
import { TradingBuyDetailPaymentWaitingForUserStep } from './TradingBuyDetailPaymentWaitingForUserStep';
import { TradingBuyDetailSidebar } from './TradingBuyDetailSidebar';
import { getBuyDetailHeaderMessages, getBuyDetailProgress, getBuyDetailStatusStep } from './utils';

export const TradingBuyDetailContent = () => {
    const accounts = useSelector(selectAccounts);
    const composedTransaction = useSelector(selectTradingComposedTransactionInfo);
    const { trade, info } = useTradingDetailContext<TradingBuyType>();
    const { translationString } = useTranslation();

    const tradeStatus = trade?.data?.status;
    const tradeStatusStep = getBuyDetailStatusStep(tradeStatus);
    const progress = getBuyDetailProgress(tradeStatus);

    const exchange = trade?.data?.exchange;
    const provider = exchange ? info?.providerInfos?.[exchange] : undefined;

    const receiveAccount = accounts.find(account => account.key === trade?.receiveAccountKey);

    useTradingDetailMissingTradeRedirect('buy', trade);

    if (!trade) {
        return null;
    }

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        amountInCrypto: trade.data.wantCrypto,
        sendAmount: trade.data.fiatStringAmount ?? '',
        sendCurrency: trade.data.fiatCurrency,
        receiveAmount: trade.data.receiveStringAmount ?? '',
        receiveCurrency: trade.data.receiveCurrency,
        networkFee: composedTransaction?.composed?.fee,
    };

    const getContent = () => {
        switch (tradeStatusStep) {
            case 'success':
                return <TradingBuyDetailPaymentSuccessful trade={trade.data} provider={provider} />;
            case 'error':
                return <TradingBuyDetailPaymentFailed trade={trade.data} provider={provider} />;
            default:
                return (
                    <TradingDetailProgress
                        {...getBuyDetailHeaderMessages(tradeStatus)}
                        type={translationString('TR_BUY').toLowerCase()}
                    >
                        <TradingBuyDetailPaymentWaitingForUserStep
                            state={getTradingDetailStepState(progress, 'customerAction')}
                            trade={trade.data}
                            providerName={getTradingProviderName(provider)}
                        />
                        <TradingDetailProcessingStep
                            state={getTradingDetailStepState(progress, 'providerProcessing')}
                            tradeType="buy"
                            trade={trade.data}
                            provider={provider}
                        />
                    </TradingDetailProgress>
                );
        }
    };

    return (
        <TradingDetailLayout
            tradeType="buy"
            tradeStatus={tradeStatus}
            statusStep={tradeStatusStep}
            provider={provider}
            tradeId={trade.data.id}
            quoteAmounts={quoteAmounts}
            country={trade.data.country}
            banner={<TradingBuyDetailPaymentBanner trade={trade.data} provider={provider} />}
            sidebar={
                <TradingBuyDetailSidebar
                    receiveAccount={receiveAccount}
                    quoteAmounts={quoteAmounts}
                    paymentMethod={trade.data.paymentMethod}
                    paymentMethodName={trade.data.paymentMethodName}
                    date={trade.date}
                    orderId={trade.data.paymentId}
                    provider={provider}
                    trade={trade.data}
                />
            }
        >
            {getContent()}
        </TradingDetailLayout>
    );
};
