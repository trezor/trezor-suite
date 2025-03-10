import { CryptoId } from 'invity-api';

import { Column, Divider } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';
import { TradingSelectedOfferInfoProps } from 'src/types/trading/tradingForm';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';
import { TradingInfoExchangeType } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoExchangeType';
import { TradingInfoHeader } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoHeader';
import { TradingInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoItem';
import { TradingInfoPaymentMethod } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoPaymentMethod';
import { TradingInfoProvider } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoProvider';
import { TradingTransactionId } from 'src/views/wallet/trading/common/TradingTransactionId';
import { TradingUtilsKyc } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsKyc';

export const TradingSelectedOfferInfo = ({
    account,
    selectedQuote,
    providers,
    quoteAmounts,
    type,
    selectedAccount,
    transactionId,
    paymentMethod,
    paymentMethodName,
}: TradingSelectedOfferInfoProps) => {
    const { exchange } = selectedQuote;

    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto: true });

    return (
        <Column gap={spacings.xl} data-testid="@trading/form/info">
            {type !== 'exchange' && (
                <>
                    <TradingInfoHeader
                        receiveCurrency={quoteAmounts?.receiveCurrency}
                        type={type}
                    />
                    <Divider margin={{}} />
                </>
            )}
            <TradingInfoItem
                account={account}
                type={type}
                label={amountLabels.sendLabel}
                currency={quoteAmounts?.sendCurrency as CryptoId}
                amount={quoteAmounts?.sendAmount}
            />
            <TradingInfoItem
                account={selectedAccount}
                type={type}
                label={amountLabels.receiveLabel}
                currency={quoteAmounts?.receiveCurrency}
                amount={quoteAmounts?.receiveAmount}
                isReceive
            />
            <Divider margin={{}} />
            {type === 'exchange' && (
                <>
                    <TradingInfoExchangeType
                        selectedQuote={selectedQuote}
                        providers={providers as TradingExchangeProvidersInfoProps}
                    />
                    <Divider margin={{}} />
                </>
            )}
            <TradingInfoProvider providers={providers} exchange={exchange} />
            {paymentMethod && (
                <TradingInfoPaymentMethod
                    paymentMethod={paymentMethod}
                    paymentMethodName={paymentMethodName}
                />
            )}
            {type === 'exchange' && (
                <TradingUtilsKyc
                    exchange={exchange}
                    providers={providers as TradingExchangeProvidersInfoProps}
                />
            )}
            {transactionId && <TradingTransactionId transactionId={transactionId} />}
        </Column>
    );
};
