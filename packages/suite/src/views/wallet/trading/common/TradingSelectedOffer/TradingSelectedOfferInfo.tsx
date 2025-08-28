import { CryptoId } from 'invity-api';

import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';
import { TradingSelectedOfferInfoProps } from 'src/types/trading/tradingForm';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';
import { TradingInfoExchangeType } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoExchangeType';
import { TradingInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoItem';
import { TradingInfoPaymentMethod } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoPaymentMethod';
import { TradingInfoProvider } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoProvider';
import { TradingTransactionId } from 'src/views/wallet/trading/common/TradingTransactionId';
import { TradingUtilsKyc } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsKyc';

import { TradingInfoFee } from './TradingInfo/TradingInfoFee';

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
    formStep,
}: TradingSelectedOfferInfoProps) => {
    const { exchange } = selectedQuote;

    const amountInCrypto = quoteAmounts?.amountInCrypto ?? true;

    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });

    const tradedAssets = [
        <TradingInfoItem
            key={amountLabels.sendLabel}
            account={account}
            type={type}
            label={amountLabels.sendLabel}
            currency={quoteAmounts?.sendCurrency as CryptoId}
            amount={quoteAmounts?.sendAmount}
            formStep={formStep}
        />,
        <TradingInfoItem
            key={amountLabels.receiveLabel}
            account={selectedAccount}
            type={type}
            label={amountLabels.receiveLabel}
            currency={quoteAmounts?.receiveCurrency}
            amount={quoteAmounts?.receiveAmount}
            formStep={formStep}
            isReceive
        />,
    ];

    const fee =
        quoteAmounts?.networkFee && account?.symbol
            ? subunitsToUnits({
                  value: asAmountSubunit(new BigNumber(quoteAmounts.networkFee)),
                  symbol: account.symbol,
              })
            : undefined;

    return (
        <Column gap={spacings.xl} data-testid="@trading/form/info">
            <Column gap={spacings.sm}>
                {type === 'sell' ? [...tradedAssets.reverse()] : tradedAssets}
                {fee && <TradingInfoFee symbol={account?.symbol} amount={fee} />}
                <TradingInfoProvider providers={providers} exchange={exchange} />
                {type === 'exchange' && (
                    <TradingInfoExchangeType
                        selectedQuote={selectedQuote}
                        providers={providers as TradingExchangeProvidersInfoProps}
                    />
                )}
                {paymentMethod && (
                    <TradingInfoPaymentMethod
                        paymentMethod={paymentMethod}
                        paymentMethodName={paymentMethodName}
                    />
                )}
            </Column>
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
