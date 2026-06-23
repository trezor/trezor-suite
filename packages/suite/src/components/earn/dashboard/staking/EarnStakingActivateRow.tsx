import { Translation } from '@suite/intl';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { getStakingLimitsByNetworkSymbol } from '@suite-common/wallet-utils';

import { useStakingYield } from 'src/hooks/earn/useStakingYield';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

import { EarnInactiveNetworkOpportunity } from '../common/EarnInactiveNetworkOpportunity';

interface EarnStakingActivateRowProps {
    symbol: NetworkSymbol;
    isCardLayout: boolean;
}

export const EarnStakingActivateRow = ({ symbol, isCardLayout }: EarnStakingActivateRowProps) => {
    const { apy } = useStakingYield({ symbol });

    const { isStakingDisabled } = useMessageSystemStaking(symbol);

    if (isStakingDisabled) return null;

    const { displaySymbol } = getNetwork(symbol);
    const minStakingAmount =
        getStakingLimitsByNetworkSymbol(symbol)?.MIN_AMOUNT_FOR_STAKING_DASHBOARD;

    return (
        <EarnInactiveNetworkOpportunity
            symbol={symbol}
            apy={apy}
            isCardLayout={isCardLayout}
            note={
                <Translation
                    id="TR_EARN_STAKING_DASHBOARD_MINIMUM_STAKE"
                    values={{
                        amount: minStakingAmount?.toString(),
                        displaySymbol,
                    }}
                />
            }
        />
    );
};
