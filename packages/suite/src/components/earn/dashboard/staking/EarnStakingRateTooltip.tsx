import { Translation } from '@suite/intl';
import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { Text } from '@trezor/components';

import { ApyValue } from '#src/views/wallet/staking/components/ApyValue';

import { StakingRateTooltip } from '../../staking/StakingRateTooltip';

interface EarnStakingRateTooltipProps {
    networkSymbol: NetworkSymbol;
    rateKind: StakingRateKind | null;
    rate: number | null;
}

export const EarnStakingRateTooltip = ({
    networkSymbol,
    rateKind,
    rate,
}: EarnStakingRateTooltipProps) => {
    if (!isApyAvailable(rate)) {
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
            <StakingRateTooltip networkSymbol={networkSymbol} rateKind={rateKind} rate={rate}>
                <ApyValue apy={rate} />
            </StakingRateTooltip>
        </Text>
    );
};
