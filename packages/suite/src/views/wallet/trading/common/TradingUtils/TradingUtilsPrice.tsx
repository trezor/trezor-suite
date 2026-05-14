import { type CryptoId, type ExchangeTrade } from 'invity-api';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import {
    type TradingTradeType,
    cryptoIdToNetworkSymbolAndContractAddress,
} from '@suite-common/trading';
import { type TokenAddress, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, Paragraph, Row, Text, Tooltip } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { BaseCurrencyValue } from 'src/components/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { type TradingCryptoAmountProps } from 'src/types/trading/trading';
import {
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';
import { TradingFiatAmount } from 'src/views/wallet/trading/common/TradingFiatAmount';

import { TradingUtilsKyc } from './TradingUtilsKyc';

const PriceValue = styled.div`
    ${typography['headline-sm']}
    color: ${({ theme }) => theme.contentPrimary};
    margin-top: ${spacingsPx.xxs};
    margin-right: ${spacingsPx.sm};

    ${SCREEN_QUERY.MOBILE} {
        ${typography['headline-sm']}
    }
`;

interface TradingUtilsPriceProps extends TradingCryptoAmountProps {
    quote: TradingTradeType;
}
export const TradingUtilsPrice = ({
    amountInCrypto,
    sendAmount,
    sendCurrency,
    receiveAmount,
    receiveCurrency,
    quote,
}: TradingUtilsPriceProps) => {
    const context = useTradingFormContext();
    const { type } = context;

    const showProviderAdjustedAmountTooltip =
        isTradingSellContext(context) &&
        receiveAmount &&
        context.quotesRequest?.cryptoStringAmount &&
        !new BigNumber(receiveAmount).isEqualTo(
            new BigNumber(context.quotesRequest?.cryptoStringAmount),
        );
    const exchangeComparatorProps = isTradingExchangeContext(context)
        ? {
              exchange: (quote as ExchangeTrade).exchange,
              isDex: (quote as ExchangeTrade).isDex,
              providers: context.exchangeInfo?.providerInfos,
          }
        : undefined;

    const { symbol, contractAddress } = receiveCurrency
        ? cryptoIdToNetworkSymbolAndContractAddress(receiveCurrency)
        : {};

    return (
        <div>
            <Paragraph typographyStyle="body-sm" intent="neutral" priority="secondary">
                {showProviderAdjustedAmountTooltip ? (
                    <Tooltip
                        hasIcon
                        placement="right"
                        content={
                            <Translation
                                id="TR_SELL_PROVIDER_ADJUSTED_AMOUNT"
                                values={{
                                    roundedAmountWithSymbol: (
                                        <TradingCryptoAmount
                                            amount={receiveAmount}
                                            cryptoId={receiveCurrency as CryptoId}
                                        />
                                    ),
                                }}
                            />
                        }
                    >
                        <Translation
                            id={
                                tradingGetAmountLabels({
                                    type,
                                    amountInCrypto: !!amountInCrypto,
                                }).labelComparatorOffer
                            }
                        />
                    </Tooltip>
                ) : (
                    <Translation
                        id={
                            tradingGetAmountLabels({
                                type,
                                amountInCrypto: !!amountInCrypto,
                            }).labelComparatorOffer
                        }
                    />
                )}
            </Paragraph>
            <Column alignItems="center" flexWrap="wrap" data-testid="@trading/offers/quote/amount">
                <Column>
                    <Row alignItems="flex-start">
                        <PriceValue>
                            {amountInCrypto ? (
                                <>
                                    <TradingFiatAmount
                                        amount={
                                            sendAmount !== undefined
                                                ? asBaseCurrencyAmount(new BigNumber(sendAmount))
                                                : undefined
                                        }
                                        currency={sendCurrency}
                                    />
                                </>
                            ) : (
                                <Column>
                                    {receiveCurrency && (
                                        <TradingCryptoAmount
                                            amount={receiveAmount}
                                            cryptoId={receiveCurrency}
                                            displayLogo
                                        />
                                    )}
                                    {symbol && receiveAmount && (
                                        <Text
                                            intent="neutral"
                                            priority="secondary"
                                            typographyStyle="body-sm"
                                            margin={{ left: spacings.xxl }}
                                        >
                                            <BaseCurrencyValue
                                                amount={receiveAmount.toString()}
                                                symbol={symbol}
                                                rateType="current"
                                                tokenAddress={
                                                    contractAddress as TokenAddress | undefined
                                                }
                                                showApproximationIndicator
                                            />
                                        </Text>
                                    )}
                                </Column>
                            )}
                        </PriceValue>
                        {exchangeComparatorProps && (
                            <Row margin={{ top: spacings.xs }}>
                                <TradingUtilsKyc
                                    exchange={exchangeComparatorProps.exchange}
                                    providers={exchangeComparatorProps.providers}
                                    isForComparator
                                    isDex={exchangeComparatorProps.isDex}
                                />
                            </Row>
                        )}
                    </Row>
                </Column>
            </Column>
        </div>
    );
};
