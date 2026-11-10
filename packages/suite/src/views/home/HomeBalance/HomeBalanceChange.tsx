import { type ReactNode } from 'react';

import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { FiatChangeAmount } from './FiatChangeAmount';
import { HiddenPlaceholder } from '../../../components/suite';
import { TrendBadge } from '../../../components/suite/Ticker/TrendBadge';

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
}: HomeBalanceChangeProps) => (
    <Row gap={12} data-testid={dataTestId}>
        <Text typographyStyle="body-md" color="contentTertiary">
            {period}
        </Text>
        <HiddenPlaceholder>
            <FiatChangeAmount change={change} />
        </HiddenPlaceholder>
        {changePercent !== undefined && <TrendBadge valueInFraction={changePercent.toNumber()} />}
    </Row>
);
