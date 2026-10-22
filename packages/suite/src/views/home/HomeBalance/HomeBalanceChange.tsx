import { type ReactNode } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { HiddenPlaceholder, Sign } from 'src/components/suite';
import { TrendBadge } from 'src/components/suite/Ticker/TrendBadge';

type HomeBalanceChangeProps = {
    /** What the change is over, e.g. "7d". */
    period: ReactNode;
    change: BigNumber;
    changePercent: BigNumber | undefined;
    'data-testid'?: string;
};

/** A fiat figure's change over a period, as the Home balance card shows it under the total. */
export const HomeBalanceChange = ({
    period,
    change,
    changePercent,
    'data-testid': dataTestId,
}: HomeBalanceChangeProps) => {
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const changed = BaseCurrencyAmountFormatter.format(asBaseCurrencyAmount(change.abs()));

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
