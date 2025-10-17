import { type CryptoId } from 'invity-api';

import { TradingTradeType, isBuyTrade, isExchangeTrade } from '@suite-common/trading';
import { asBaseCurrencyAmount } from '@suite-common/wallet-utils';
import { Button, Column, InfoItem, Row, Text } from '@trezor/components';
import { copyToClipboard } from '@trezor/dom-utils';
import { spacings } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { Translation } from 'src/components/suite/Translation';
import { TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';
import { TradingSelectedOfferInfoProps } from 'src/types/trading/tradingForm';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';
import { TradingInfoExchangeType } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoExchangeType';
import { TradingInfoPaymentMethod } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoPaymentMethod';
import { TradingInfoProvider } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoProvider';
import { TradingUtilsKyc } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsKyc';

import { TradingFiatAmount } from '../TradingFiatAmount';
import { TradingInfoItem } from './TradingInfo/TradingInfoItem';
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
    transactionId,
    paymentMethod,
    paymentMethodName,
}: TradingSelectedOfferInfoProps) => {
    const { exchange } = selectedQuote;

    const amountInCrypto = quoteAmounts?.amountInCrypto ?? true;

    const amountLabels = tradingGetAmountLabels({ type, amountInCrypto });

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
                    isReceive
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

                {type === 'exchange' && (
                    <TradingUtilsKyc
                        exchange={exchange}
                        providers={providers as TradingExchangeProvidersInfoProps}
                    />
                )}

                {type === 'exchange' && transactionId && (
                    <InfoItem label={<Translation id="TR_TRADING_TRANS_ID" />} direction="column">
                        <Text typographyStyle="hint">{transactionId}</Text>
                        <Button
                            size="tiny"
                            variant="tertiary"
                            onClick={() => copyToClipboard(transactionId)}
                        >
                            <Translation id="TR_COPY_TO_CLIPBOARD" />
                        </Button>
                    </InfoItem>
                )}
            </Column>
        </Column>
    );
};
