import { HiddenPlaceholder } from '@suite/discreet-mode';
import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { useSelector } from '@suite-common/redux-utils';
import { type NetworkSymbol, type NetworkSymbolExtended } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectFiatRatesByFiatRateKey } from '@suite-common/wallet-core';
import {
    type Timestamp,
    type TokenAddress,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { Column, Row, Text, Tooltip } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { FormattedDate } from 'src/components/suite/FormattedDate';
import { TrendBadge, calculatePercentageDifference } from 'src/components/suite/Ticker/TrendBadge';
// Unit prices are rendered with the same precision as PriceTicker so that
// low-value assets do not round to zero.
const UNIT_PRICE_FORMATTER_OPTIONS = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
};

type HistoricRateChangeProps = {
    symbol: NetworkSymbol;
    historicRate: number | undefined;
    historicTimestamp: Timestamp;
    tokenAddress?: TokenAddress;
    // Symbol shown in the tooltip heading; the rate lookup always uses `symbol` + `tokenAddress`.
    displaySymbol?: NetworkSymbolExtended;
};

const isValidRate = (rate: number | undefined): rate is number =>
    rate !== undefined && Number.isFinite(rate) && rate > 0;

export const HistoricRateChange = ({
    symbol,
    historicRate,
    historicTimestamp,
    tokenAddress,
    displaySymbol,
}: HistoricRateChangeProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, baseCurrencyCode, tokenAddress);
    const currentRate = useSelector(state => selectFiatRatesByFiatRateKey(state, fiatRateKey));

    const { BaseCurrencyAmountFormatter } = useFormatters();

    const currentRateValue = currentRate?.rate;
    const currentRateTimestamp = currentRate?.lastTickerTimestamp;

    if (
        currentRate?.error ||
        !isValidRate(historicRate) ||
        !isValidRate(currentRateValue) ||
        !currentRateTimestamp
    ) {
        return null;
    }

    const renderUnitPrice = (rate: number) => (
        <HiddenPlaceholder>
            <BaseCurrencyAmountFormatter
                currency={baseCurrencyCode}
                value={asBaseCurrencyAmount(new BigNumber(rate))}
                {...UNIT_PRICE_FORMATTER_OPTIONS}
            />
        </HiddenPlaceholder>
    );

    return (
        <Tooltip
            content={
                <Column gap={4} alignItems="stretch">
                    <Text typographyStyle="body-sm-strong">
                        <FormattedCryptoAmount
                            value="1"
                            symbol={displaySymbol ?? symbol}
                            contractAddress={tokenAddress}
                        />
                    </Text>
                    <Row gap={16} justifyContent="space-between">
                        <FormattedDate value={new Date(historicTimestamp * 1000)} date />
                        {renderUnitPrice(historicRate)}
                    </Row>
                    <Row gap={16} justifyContent="space-between">
                        <Translation
                            id="TR_TODAY_DATE"
                            values={{
                                date: (
                                    <FormattedDate
                                        value={currentRateTimestamp}
                                        date
                                        year={undefined}
                                    />
                                ),
                            }}
                        />
                        {renderUnitPrice(currentRateValue)}
                    </Row>
                </Column>
            }
        >
            <TrendBadge
                valueInFraction={calculatePercentageDifference(currentRateValue, historicRate)}
            />
        </Tooltip>
    );
};
