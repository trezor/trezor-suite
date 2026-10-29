import { type ReactNode } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { HiddenPlaceholder, Sign } from 'src/components/suite';
import { TrendBadge } from 'src/components/suite/Ticker/TrendBadge';

const MIN_EXACT_DECIMALS = 2;

type HomeBalanceChangeProps = {
    /** What the change is over, e.g. "7d". */
    period: ReactNode;
    change: BigNumber;
    changePercent: BigNumber | undefined;
    /** Every decimal of the change, as a price's change needs, rather than cents. */
    isExact?: boolean;
    'data-testid'?: string;
};

/** A fiat figure's change over a period, as the Home balance card shows it under the total. */
export const HomeBalanceChange = ({
    period,
    change,
    changePercent,
    isExact = false,
    'data-testid': dataTestId,
}: HomeBalanceChangeProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const absoluteChange = asBaseCurrencyAmount(change.abs());
    const exactDecimals = Math.max(MIN_EXACT_DECIMALS, absoluteChange.decimalPlaces() ?? 0);
    const changed = BaseCurrencyAmountFormatter.format(
        absoluteChange,
        isExact
            ? { minimumFractionDigits: exactDecimals, maximumFractionDigits: exactDecimals }
            : {},
    );

    return (
        <Row gap={12} data-testid={dataTestId}>
            <Text typographyStyle="body-md" color="contentTertiary">
                {period}
            </Text>
            <HiddenPlaceholder>
                <Row gap={0} alignItems="center">
                    <Sign value={change} />
                    <Text typographyStyle="body-md">{changed}</Text>
                </Row>
            </HiddenPlaceholder>
            {changePercent !== undefined && (
                <TrendBadge valueInFraction={changePercent.toNumber()} />
            )}
        </Row>
    );
};
