import { Translation } from '@suite/intl';
import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { Text } from '@trezor/components';

import { ApyValue } from '#src/views/wallet/staking/components/ApyValue';

import { EarnRateTooltip } from '../common/EarnRateTooltip';

interface EarnStakingRateTooltipProps {
    rateKind: StakingRateKind | null;
    rate: number | null;
}

export const EarnStakingRateTooltip = ({ rateKind, rate }: EarnStakingRateTooltipProps) => {
    if (!rate) {
        return (
            <Text typographyStyle="body-sm">
                <Translation id="TR_EARN_NOT_AVAILABLE" />
            </Text>
        );
    }

    return (
        <Text
            typographyStyle="body-sm-strong"
            intent="neutral"
            priority="primary"
            data-testid="@earn/dashboard/staking-rate"
        >
            <EarnRateTooltip
                content={
                    <Translation
                        id={
                            rateKind === 'apr'
                                ? 'TR_EARN_STAKING_APR_TOOLTIP'
                                : 'TR_EARN_STAKING_APY_TOOLTIP'
                        }
                    />
                }
                tooltipMaxWidth={280}
            >
                <ApyValue apy={rate} />
            </EarnRateTooltip>
        </Text>
    );
};
