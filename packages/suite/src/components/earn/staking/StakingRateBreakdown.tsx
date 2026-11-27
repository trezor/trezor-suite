import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { TokenIcon } from '@trezor/product-components';

import { EarnRateBreakdown } from '../common/EarnRateBreakdown';
import { EarnRateBreakdownRow } from '../common/EarnRateBreakdownRow';

type StakingRateBreakdownProps = {
    networkSymbol: NetworkSymbol;
    rate: number;
    rateKind: StakingRateKind;
};

export const StakingRateBreakdown = ({
    networkSymbol,
    rate,
    rateKind,
}: StakingRateBreakdownProps) => {
    const { PercentageFormatter } = useFormatters();
    const formattedRate = PercentageFormatter.format(rate);
    const isApr = rateKind === 'apr';

    return (
        <EarnRateBreakdown
            footer={
                <Translation
                    id={
                        isApr
                            ? 'TR_EARN_STAKING_APR_TOOLTIP_FOOTER'
                            : 'TR_EARN_YIELD_APY_TOOLTIP_FOOTER'
                    }
                />
            }
        >
            <EarnRateBreakdownRow
                icon={<TokenIcon networkSymbol={networkSymbol} size={20} isBordered={false} />}
                symbol={<AssetSymbol networkSymbol={networkSymbol} />}
                description={
                    <Translation
                        id={
                            isApr
                                ? 'TR_EARN_STAKING_APR_DESCRIPTION'
                                : 'TR_EARN_STAKING_APY_DESCRIPTION'
                        }
                    />
                }
                value={
                    isApr ? (
                        <Translation
                            id="TR_EARN_APR_APPROX"
                            values={{ aprPercent: formattedRate }}
                        />
                    ) : (
                        <Translation
                            id="TR_EARN_APY_APPROX"
                            values={{ apyPercent: formattedRate }}
                        />
                    )
                }
                hasRate
            />
        </EarnRateBreakdown>
    );
};
