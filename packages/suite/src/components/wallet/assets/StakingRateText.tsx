import { Translation } from '@suite/intl';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';

import { useFormatApy } from '#src/hooks/earn/useFormatApy';

type StakingRateTextProps = {
    networkSymbol: NetworkSymbol;
    apy: number;
};

/** The rate a stake earns: an APR where the network pays one, as Tron does, else an APY. */
export const StakingRateText = ({ networkSymbol, apy }: StakingRateTextProps) => {
    const formatApy = useFormatApy();

    // Tron pays its rate as an APR, as its Earn modal says.
    return getNetworkType(networkSymbol) === 'tron' ? (
        <Translation id="TR_EARN_APR_APPROX" values={{ aprPercent: formatApy(apy) }} />
    ) : (
        <Translation id="TR_EARN_YIELD_BADGE_RATE" values={{ apy: formatApy(apy) }} />
    );
};
