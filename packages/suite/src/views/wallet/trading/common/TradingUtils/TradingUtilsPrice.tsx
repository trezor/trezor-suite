import { CryptoId } from 'invity-api';
import styled from 'styled-components';

import { ExperimentId } from '@suite-common/message-system';
import {
    TradingTradeMapProps,
    cryptoIdToNetworkSymbolAndContractAddress,
} from '@suite-common/trading';
import { TokenAddress, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Column, Paragraph, Row, Text, Tooltip } from '@trezor/components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { spacings, spacingsPx, typography } from '@trezor/theme';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { BaseCurrencyValue } from 'src/components/suite';
import { ExperimentWrapper } from 'src/components/suite/Experiment/ExperimentWrapper';
import { Translation } from 'src/components/suite/Translation';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingCryptoAmountProps } from 'src/types/trading/trading';
import {
    isTradingExchangeContext,
    isTradingSellContext,
} from 'src/utils/wallet/trading/tradingTypingUtils';
import { tradingGetAmountLabels } from 'src/utils/wallet/trading/tradingUtils';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';
import { TradingFiatAmount } from 'src/views/wallet/trading/common/TradingFiatAmount';

import { TradingUtilsKyc } from './TradingUtilsKyc';

const PriceValue = styled.div`
    ${typography.titleSmall}
    color: ${({ theme }) => theme.textDefault};
    margin-top: ${spacingsPx.xxs};
    margin-right: ${spacingsPx.sm};

    ${SCREEN_QUERY.MOBILE} {
        ${typography.titleSmall}
    }
`;

interface TradingUtilsPriceProps extends TradingCryptoAmountProps {
    quote: TradingTradeMapProps[keyof TradingTradeMapProps];
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

    const { symbol, contractAddress } = receiveCurrency
        ? cryptoIdToNetworkSymbolAndContractAddress(receiveCurrency)
        : {};

    return (
        <div>
            <Paragraph typographyStyle="hint" variant="tertiary">
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
                                    <ExperimentWrapper
                                        id={ExperimentId.tradingFiatValues}
                                        components={[
                                            { variant: 'A', element: <></> },
                                            {
                                                variant: 'B',
                                                element:
                                                    symbol && receiveAmount ? (
                                                        <Text
                                                            variant="tertiary"
                                                            typographyStyle="hint"
                                                            margin={{ left: spacings.xxl }}
                                                        >
                                                            <BaseCurrencyValue
                                                                amount={receiveAmount.toString()}
                                                                symbol={symbol}
                                                                rateType="current"
                                                                tokenAddress={
                                                                    contractAddress as
                                                                        | TokenAddress
                                                                        | undefined
                                                                }
                                                                showApproximationIndicator
                                                            />
                                                        </Text>
                                                    ) : (
                                                        <></>
                                                    ),
                                            },
                                        ]}
                                    />
                                </Column>
                            )}
                        </PriceValue>
                        {isTradingExchangeContext(context) && (
                            <Row margin={{ top: spacings.xs }}>
                                <TradingUtilsKyc
                                    exchange={quote.exchange}
                                    providers={context.exchangeInfo?.providerInfos}
                                    isForComparator
                                />
                            </Row>
                        )}
                    </Row>
                </Column>
            </Column>
        </div>
    );
};
