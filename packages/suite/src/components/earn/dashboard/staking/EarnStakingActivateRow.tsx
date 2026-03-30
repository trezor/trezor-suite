import { Translation } from '@suite/intl';
import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { selectPoolStatsApy } from '@suite-common/wallet-core';
import { getStakingLimitsByNetworkSymbol } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

import { EarnInactiveNetworkOpportunity } from '../common/EarnInactiveNetworkOpportunity';

export const EarnStakingActivateRow = ({ symbol }: { symbol: NetworkSymbol }) => {
    const apy = useSelector(state => selectPoolStatsApy(state, { networkSymbol: symbol }));

    const { displaySymbol } = getNetwork(symbol);
    const minStakingAmount =
        getStakingLimitsByNetworkSymbol(symbol)?.MIN_AMOUNT_FOR_STAKING_DASHBOARD;

    return (
        <EarnInactiveNetworkOpportunity
            symbol={symbol}
            apy={apy}
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
