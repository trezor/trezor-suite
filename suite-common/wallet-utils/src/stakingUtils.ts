import { Account } from '@suite-common/wallet-types';
import { NetworkSymbol } from '@suite-common/wallet-config';

import {
    getEthAccountTotalStakingBalance,
    isSupportedEthStakingNetworkSymbol,
} from './ethereumStakingUtils';
import {
    getSolAccountTotalStakingBalance,
    isSupportedSolStakingNetworkSymbol,
} from './solanaStakingUtils';

export const getAccountTotalStakingBalance = (account: Account) => {
    if (!account) return null;

    if (account.networkType === 'ethereum') {
        return getEthAccountTotalStakingBalance(account);
    }

    if (account.networkType === 'solana') {
        return getSolAccountTotalStakingBalance(account);
    }
};

export const isSupportedStakingNetworkSymbol = (symbol: NetworkSymbol) => {
    return isSupportedEthStakingNetworkSymbol(symbol) || isSupportedSolStakingNetworkSymbol(symbol);
};
