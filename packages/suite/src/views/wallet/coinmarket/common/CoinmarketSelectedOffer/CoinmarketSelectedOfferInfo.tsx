import { CryptoId } from 'invity-api';
import { Column } from '@trezor/components';
import { CoinmarketTransactionId } from 'src/views/wallet/coinmarket/common';
import { coinmarketGetAmountLabels } from 'src/utils/wallet/coinmarket/coinmarketUtils';
import { CoinmarketInfoHeader } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoHeader';
import { CoinmarketInfoItem } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoItem';
import { CoinmarketInfoProvider } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoProvider';
import { CoinmarketInfoPaymentMethod } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketInfo/CoinmarketInfoPaymentMethod';
import { spacings } from '@trezor/theme';
import { CoinmarketBorder, CoinmarketTestWrapper } from 'src/views/wallet/coinmarket';
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

    const amountLabels = coinmarketGetAmountLabels({ type, amountInCrypto: true });

    return (
        <CoinmarketTestWrapper data-testid="@coinmarket/form/info">
            <Column gap={spacings.xl} alignItems="stretch">
                {type !== 'exchange' && (
                    <CoinmarketInfoHeader receiveCurrency={quoteAmounts?.receiveCurrency} />
                )}
                <CoinmarketInfoItem
                    account={account}
                    type={type}
                    label={amountLabels.sendLabel}
                    currency={quoteAmounts?.sendCurrency as CryptoId}
                    amount={quoteAmounts?.sendAmount}
                />
                <CoinmarketInfoItem
                    account={selectedAccount}
                    type={type}
                    label={amountLabels.receiveLabel}
                    currency={quoteAmounts?.receiveCurrency}
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
        </CoinmarketTestWrapper>
    );
};
