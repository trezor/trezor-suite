import { Translation } from '@suite/intl';
import { Row, Text } from '@trezor/components';
import { type BigNumber } from '@trezor/utils';

import { TrendBadge } from '#src/components/suite/Ticker/TrendBadge';
import { FiatChangeAmount } from '#src/views/home/HomeBalance/FiatChangeAmount';

type AssetDetailPriceChangeProps = {
    change: BigNumber;
    changePercent: BigNumber;
    'data-testid'?: string;
};

export const AssetDetailPriceChange = ({
    change,
    changePercent,
    'data-testid': dataTestId,
}: AssetDetailPriceChangeProps) => (
    <Row gap={12} data-testid={dataTestId}>
        <Text typographyStyle="body-md" color="contentTertiary">
            <Translation id="TR_HOME_ASSET_WEEK_PERIOD" />
        </Text>
        <FiatChangeAmount change={change} isExact />
        <TrendBadge valueInFraction={changePercent.toNumber()} />
    </Row>
);
