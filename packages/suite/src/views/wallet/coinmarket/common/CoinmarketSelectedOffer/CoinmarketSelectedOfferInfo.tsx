import { CryptoSymbol } from 'invity-api';
import { Column } from '@trezor/components';
import { CoinmarketTransactionId } from 'src/views/wallet/coinmarket/common';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { coinmarketGetAmountLabels } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketInfoHeader } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoHeader';
import { CoinmarketInfoItem } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoItem';
import { CoinmarketInfoProvider } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoProvider';
import { CoinmarketInfoPaymentMethod } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoPaymentMethod';
import { spacings } from '@trezor/theme';
import { CoinmarketBorder } from 'src/views/wallet/coinmarket';
import { CoinmarketInfoExchangeType } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoExchangeType';
import { CoinmarketSelectedOfferInfoProps } from 'src/types/coinmarket/coinmarketForm';
import { CoinmarketUtilsKyc } from 'src/views/wallet/coinmarket/common/CoinmarketUtils/CoinmarketUtilsKyc';
import { CoinmarketExchangeProvidersInfoProps } from 'src/types/coinmarket/coinmarket';

export const CoinmarketSelectedOfferInfo = ({
    account,
    selectedQuote,
    providers,
    quoteAmounts,
    type,
    selectedAccount,
    transactionId,
    paymentMethod,
    paymentMethodName,
}: CoinmarketSelectedOfferInfoProps) => {
    const { exchange } = selectedQuote;

    const receiveCurrency = quoteAmounts?.receiveCurrency
        ? cryptoToCoinSymbol(quoteAmounts.receiveCurrency)
        : undefined;
    const sendCurrency =
        type === 'exchange' && quoteAmounts?.sendCurrency
            ? cryptoToCoinSymbol(quoteAmounts.sendCurrency as CryptoSymbol)
            : quoteAmounts?.sendCurrency;

    const amountLabels = coinmarketGetAmountLabels({ type, amountInCrypto: true });

    return (
        <Column gap={spacings.xl} alignItems="stretch">
            {type !== 'exchange' && (
                <CoinmarketInfoHeader receiveCurrency={quoteAmounts?.receiveCurrency} />
            )}
            <CoinmarketInfoItem
                account={account}
                type={type}
                label={amountLabels.sendLabel}
                currency={sendCurrency}
                amount={quoteAmounts?.sendAmount}
            />
            <CoinmarketInfoItem
                account={selectedAccount}
                type={type}
                label={amountLabels.receiveLabel}
                currency={receiveCurrency}
                amount={quoteAmounts?.receiveAmount}
                isReceive
            />
            <CoinmarketBorder />
            {type === 'exchange' && (
                <>
                    <CoinmarketInfoExchangeType
                        selectedQuote={selectedQuote}
                        providers={providers as CoinmarketExchangeProvidersInfoProps}
                    />
                    <CoinmarketBorder />
                </>
            )}
            <CoinmarketInfoProvider providers={providers} exchange={exchange} />
            {paymentMethod && (
                <CoinmarketInfoPaymentMethod
                    paymentMethod={paymentMethod}
                    paymentMethodName={paymentMethodName}
                />
            )}
            {type === 'exchange' && (
                <>
                    <CoinmarketUtilsKyc
                        exchange={exchange}
                        providers={providers as CoinmarketExchangeProvidersInfoProps}
                    />
                </>
            )}
            {transactionId && <CoinmarketTransactionId transactionId={transactionId} />}
        </Column>
    );
};
