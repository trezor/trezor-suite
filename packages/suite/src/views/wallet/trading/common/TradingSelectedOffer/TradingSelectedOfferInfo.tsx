import { type CryptoId } from 'invity-api';

import { Translation } from '@suite/intl';
import { TradingTradeType, isBuyTrade, isExchangeTrade } from '@suite-common/trading';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, InfoItem, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';
import { TradingSelectedOfferInfoProps } from 'src/types/trading/tradingForm';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';
import { TradingInfoExchangeType } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoExchangeType';
import { TradingInfoPaymentMethod } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoPaymentMethod';
import { TradingUtilsKyc } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsKyc';

import { TradingFiatAmount } from '../TradingFiatAmount';
import { TradingInfoItem } from './TradingInfo/TradingInfoItem';
import { TradingInfoProvider } from './TradingInfo/TradingInfoProvider';
import { TradingInfoRateType } from './TradingInfo/TradingInfoRateType';

function getReceiveAddress(selectedQuote: TradingTradeType) {
    if (!isExchangeTrade(selectedQuote) && !isBuyTrade(selectedQuote)) {
        return undefined;
    }

    return selectedQuote.receiveAddress;
}

export const TradingSelectedOfferInfo = ({
    account,
    selectedQuote,
    providers,
    quoteAmounts,
    type,
    selectedAccount,
    paymentMethod,
    paymentMethodName,
}: TradingSelectedOfferInfoProps) => {
    const { exchange } = selectedQuote;

    const amountInCrypto = quoteAmounts?.amountInCrypto ?? true;
    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });
    // Check if we're in detail view (completed trade) vs form view (quote)
    // Completed trades have a txid property (transaction ID) after transaction is sent
    const isDetailView = 'txid' in selectedQuote && selectedQuote.txid !== undefined;

    return (
        <Column gap={spacings.lg} data-testid="@trading/form/info">
            {type === 'buy' && (
                <TradingInfoItem
                    key={amountLabels.receiveLabel}
                    account={selectedAccount}
                    type={type}
                    label={amountLabels.receiveLabel}
                    currency={quoteAmounts?.receiveCurrency}
                    amount={quoteAmounts?.receiveAmount}
                    receiveAddress={getReceiveAddress(selectedQuote)}
                    isReceive
                />
            )}

            {type === 'sell' && (
                <TradingInfoItem
                    key={amountLabels.receiveLabel}
                    account={selectedAccount}
                    type={type}
                    label={amountLabels.receiveLabel}
                    currency={quoteAmounts?.receiveCurrency}
                    amount={quoteAmounts?.receiveAmount}
                    receiveAddress={getReceiveAddress(selectedQuote)}
                />
            )}

            {type === 'exchange' && (
                <>
                    <TradingInfoItem
                        key={amountLabels.sendLabel}
                        account={account}
                        type={type}
                        label={amountLabels.sendLabel}
                        currency={quoteAmounts?.sendCurrency as CryptoId}
                        amount={quoteAmounts?.sendAmount}
                    />

                    <TradingInfoItem
                        key={amountLabels.receiveLabel}
                        account={selectedAccount}
                        type={type}
                        label={amountLabels.receiveLabel}
                        currency={quoteAmounts?.receiveCurrency}
                        amount={quoteAmounts?.receiveAmount}
                        receiveAddress={getReceiveAddress(selectedQuote)}
                        isReceive
                    />
                </>
            )}

            <Column gap={spacings.xs}>
                {type === 'buy' && (
                    <InfoItem label={<Translation id={amountLabels.sendLabel} />} direction="row">
                        <Row data-testid="@trading/form/info/fiat-amount">
                            <TradingFiatAmount
                                amount={
                                    quoteAmounts?.sendAmount !== undefined
                                        ? asBaseCurrencyAmount(
                                              new BigNumber(quoteAmounts?.sendAmount),
                                          )
                                        : undefined
                                }
                                currency={quoteAmounts?.sendCurrency as CryptoId}
                            />
                        </Row>
                    </InfoItem>
                )}

                {type === 'sell' && (
                    <InfoItem label={<Translation id={amountLabels.sendLabel} />} direction="row">
                        <Row data-testid="@trading/form/info/fiat-amount">
                            <TradingFiatAmount
                                amount={
                                    quoteAmounts?.sendAmount !== undefined
                                        ? asBaseCurrencyAmount(
                                              new BigNumber(quoteAmounts?.sendAmount),
                                          )
                                        : undefined
                                }
                                currency={quoteAmounts?.sendCurrency as CryptoId}
                            />
                        </Row>
                    </InfoItem>
                )}

                {type === 'exchange' && (
                    <TradingInfoRateType
                        selectedQuote={selectedQuote}
                        providers={providers as TradingExchangeProvidersInfoProps}
                    />
                )}

                {type === 'sell' && !isDetailView && (
                    <TradingInfoProvider providers={providers} exchange={exchange} />
                )}

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

                {type === 'exchange' && (
                    <TradingUtilsKyc
                        exchange={exchange}
                        providers={providers as TradingExchangeProvidersInfoProps}
                    />
                )}
            </Column>
        </Column>
    );
};
