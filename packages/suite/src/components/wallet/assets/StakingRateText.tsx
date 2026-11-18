import { Translation } from '@suite/intl';
import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { isApyAvailable } from '@suite-common/wallet-utils';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';

type StakingRateTextProps = {
    rate: number | null;
    rateKind: StakingRateKind;
};

/** The rate a stake earns as its product pays it, an APR or an APY, or that it has none. */
export const StakingRateText = ({ rate, rateKind }: StakingRateTextProps) => {
    const formatApy = useFormatApy();
    const isApr = rateKind === 'apr';

    // A product without a rate, a testnet, says so.
    if (rate === null || !isApyAvailable(rate)) {
        return (
            <Translation id={isApr ? 'TR_EARN_APR_NOT_AVAILABLE' : 'TR_EARN_APY_NOT_AVAILABLE'} />
        );
    }

    // Tron pays its rate as an APR, as its Earn modal says.
    return isApr ? (
        <Translation id="TR_EARN_APR_APPROX" values={{ aprPercent: formatApy(rate) }} />
    ) : (
        <Translation id="TR_EARN_YIELD_BADGE_RATE" values={{ apy: formatApy(rate) }} />
    );
};
