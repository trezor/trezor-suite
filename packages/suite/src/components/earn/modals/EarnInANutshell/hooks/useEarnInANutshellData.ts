import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectPoolStatsApyData, selectValidatorsQueueData } from '@suite-common/wallet-core';
import { getUnstakingPeriodInDays } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

export const useEarnInANutshellData = () => {
    const account = useSelector(selectSelectedAccount);
    const { validatorWithdrawTime, validatorExitTime } = useSelector(state =>
        selectValidatorsQueueData(state, account?.symbol),
    );
    const apy = useSelector(state => selectPoolStatsApyData(state, account));

    if (!account) {
        return null;
    }

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const unstakingPeriod = getUnstakingPeriodInDays({
        networkType: account.networkType,
        validatorWithdrawTime,
        validatorExitTime,
    });

    return {
        account,
        displaySymbol,
        unstakingPeriod,
        apy,
    };
};
