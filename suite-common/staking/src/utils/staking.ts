import { CARDANO_STAKING_REGISTRATION_DEPOSIT } from '@suite-common/wallet-constants';
import { type Account, type StakeType } from '@suite-common/wallet-types';
import { calculateRewards } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { getEthereumStakingAddressByType } from './ethereumStaking';

export const calculateGains = (amount: string, apy: number | null, days: number) => {
    const rewards = calculateRewards(amount, apy, days);

    return new BigNumber(rewards).toFixed(5, 1);
};

export const getNetworkAdjustedStakingBalance = (amount: string, account?: Account) => {
    if (account?.networkType === 'cardano') {
        const adjusted = new BigNumber(amount).minus(CARDANO_STAKING_REGISTRATION_DEPOSIT);

        return BigNumber.max(adjusted, 0).toString();
    }

    return amount;
};

export const getStakingContractAddress = (account: Account, stakeType: StakeType) => {
    if (!account) return '';

    switch (account.networkType) {
        case 'ethereum':
            return getEthereumStakingAddressByType(account.symbol, stakeType);
        case 'solana':
        default:
            return account.descriptor;
    }
};
