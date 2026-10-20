import { type EthValidatorsQueue } from '@suite-common/earn-staking-api';
import { type WalletAccountTransaction } from '@suite-common/wallet-types';
import { secondsToDays } from '@suite-common/wallet-utils';

import { DAYS_TO_ADD_TO_POOL_DEFAULT } from './everstakeConstants';

export const getDaysToAddToPool = (
    stakeTxs: WalletAccountTransaction[],
    validatorsQueue?: EthValidatorsQueue | null,
) => {
    if (
        validatorsQueue?.addingDelay === undefined ||
        validatorsQueue?.activationTime === undefined
    ) {
        return undefined;
    }

    const lastTxBlockTime = stakeTxs[0]?.blockTime;

    if (!lastTxBlockTime) {
        return undefined;
    }

    const now = Math.floor(Date.now() / 1000);

    const secondsToWait =
        lastTxBlockTime + validatorsQueue.addingDelay + validatorsQueue.activationTime - now;
    const daysToWait = secondsToDays(secondsToWait);

    return daysToWait <= 0 ? 1 : daysToWait;
};

export const getDaysToUnstake = (
    unstakeTxs: WalletAccountTransaction[],
    validatorsQueue?: EthValidatorsQueue | null,
) => {
    if (typeof validatorsQueue?.withdrawTime !== 'number') {
        return undefined;
    }

    const now = Math.floor(Date.now() / 1000);
    const lastTxBlockTime = unstakeTxs[0]?.blockTime || now;

    const secondsToWait =
        lastTxBlockTime + validatorsQueue.withdrawTime + (validatorsQueue?.exitTime || 0) - now;
    const daysToWait = secondsToDays(secondsToWait);

    return daysToWait <= 0 ? 1 : daysToWait;
};

export const getDaysToAddToPoolInitial = (validatorsQueue?: EthValidatorsQueue | null) => {
    if (
        validatorsQueue?.addingDelay === undefined ||
        validatorsQueue?.activationTime === undefined
    ) {
        return DAYS_TO_ADD_TO_POOL_DEFAULT;
    }

    const secondsToWait = validatorsQueue.addingDelay + validatorsQueue.activationTime;
    const daysToWait = secondsToDays(secondsToWait);

    return daysToWait <= 0 ? 1 : daysToWait;
};
