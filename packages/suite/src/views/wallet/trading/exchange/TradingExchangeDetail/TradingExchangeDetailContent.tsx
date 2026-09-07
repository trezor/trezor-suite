import { useTranslation } from '@suite/intl';
import {
    type TradingExchangeType,
    selectTradingComposedTransactionInfo,
    selectTradingDisplayComposedFee,
} from '@suite-common/trading';
import { selectAccounts } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { useTradingDetailContext } from 'src/hooks/wallet/trading/useTradingDetail';
import { useTradingDetailMissingTradeRedirect } from 'src/hooks/wallet/trading/useTradingDetailMissingTradeRedirect';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';
import { TradingDetailLayout } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailLayout';
import { TradingDetailProcessingStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProcessingStep';
import { TradingDetailProgress } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailProgress';
import { TradingDetailSendingStep } from 'src/views/wallet/trading/common/TradingDetail/TradingDetailSendingStep';
import {
    getTradingDetailStepState,
    processingHeaderMessages,
} from 'src/views/wallet/trading/common/TradingDetail/utils';

import { TradingExchangeDetailPaymentFailed } from './TradingExchangeDetailPaymentFailed';
import { TradingExchangeDetailPaymentKYC } from './TradingExchangeDetailPaymentKYC';
import { TradingExchangeDetailPaymentSuccessful } from './TradingExchangeDetailPaymentSuccessful';
import { TradingExchangeDetailSidebar } from './TradingExchangeDetailSidebar';
import { getExchangeDetailProgress, getExchangeDetailStatusStep } from './utils';

export const TradingExchangeDetailContent = () => {
    const accounts = useSelector(selectAccounts);
    const composedTransaction = useSelector(selectTradingComposedTransactionInfo);
    const { trade, info } = useTradingDetailContext<TradingExchangeType>();
    const { translationString } = useTranslation();

    const tradeStatus = trade?.data?.status || 'CONFIRMING';
    const tradeStatusStep = getExchangeDetailStatusStep(tradeStatus);
    const isDex = trade?.data?.isDex;
    const progress = getExchangeDetailProgress(tradeStatus, isDex);

    const exchange = trade?.data?.exchange;
    const provider = exchange ? info?.providerInfos?.[exchange] : undefined;

    const networkFee = useSelector(reduxState =>
        selectTradingDisplayComposedFee(reduxState, trade?.data),
    );

    const sendAccount = accounts.find(account => account.key === trade?.sendAccountKey);
    const receiveAccount = accounts.find(account => account.key === trade?.receiveAccountKey);

    useTradingDetailMissingTradeRedirect('exchange', trade);

    if (!trade) {
        return null;
    }

    const quoteAmounts: TradingGetCryptoQuoteAmountProps = {
        sendAmount: trade.data.sendStringAmount ?? '',
        sendCurrency: trade.data.send,
        receiveAmount: trade.data.receiveStringAmount ?? '',
        receiveCurrency: trade.data.receive,
        networkFee,
    };

    const getContent = () => {
        switch (tradeStatusStep) {
            case 'success':
                return (
                    <TradingExchangeDetailPaymentSuccessful
                        trade={trade.data}
                        account={sendAccount}
                        receiveAccountKey={trade.receiveAccountKey}
                        provider={provider}
                    />
                );
            case 'error':
                return (
                    <TradingExchangeDetailPaymentFailed
                        trade={trade.data}
                        account={sendAccount}
                        receiveAccountKey={trade.receiveAccountKey}
                        provider={provider}
                    />
                );
            case 'kyc':
                return (
                    <TradingExchangeDetailPaymentKYC
                        trade={trade.data}
                        account={sendAccount}
                        receiveAccountKey={trade.receiveAccountKey}
                        provider={provider}
                    />
                );
            default:
                return (
                    <TradingDetailProgress
                        {...processingHeaderMessages}
                        type={translationString('TR_TRADING_SWAP').toLowerCase()}
                    >
                        {!trade.data.isDex && (
                            <TradingDetailSendingStep
                                state={getTradingDetailStepState(progress, 'customerAction')}
                                account={sendAccount}
                                receiveAccountKey={trade.receiveAccountKey}
                                txId={trade.data.receiveTxHash}
                                composedTransaction={composedTransaction}
                            />
                        )}
                        <TradingDetailProcessingStep
                            state={getTradingDetailStepState(progress, 'providerProcessing')}
                            tradeType="exchange"
                            trade={trade.data}
                            provider={provider}
                            isDex={trade.data.isDex}
                        />
                    </TradingDetailProgress>
                );
        }
    };

    return (
        <TradingDetailLayout
            tradeType="exchange"
            tradeStatus={tradeStatus}
            statusStep={tradeStatusStep}
            provider={provider}
            tradeId={trade.data.id}
            quoteAmounts={quoteAmounts}
            sidebar={
                <TradingExchangeDetailSidebar
                    sendAccount={sendAccount}
                    receiveAccount={receiveAccount}
                    trade={trade.data}
                    providers={info?.providerInfos}
                    date={trade.date}
                />
            }
        >
            {getContent()}
        </TradingDetailLayout>
    );
};
