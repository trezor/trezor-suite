import { useEthereumValidatorsQueue } from '@suite-common/earn-staking-api';
import { getDaysToAddToPool } from '@suite-common/staking';
import { DAYS_TO_ADD_TO_POOL_DEFAULT, SOLANA_EPOCH_DAYS } from '@suite-common/wallet-constants';
import { selectAccountByKey, selectAccountStakeTransactions } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    hasStakeInPendingDepositedState,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { type NativeStakingRootState, useSelector } from '@suite-native/staking';

export const useStakingEntryPeriodEstimateInDays = (accountKey: AccountKey) => {
    const account = useSelector((state: NativeStakingRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const stakeTxs = useSelector((state: NativeStakingRootState) =>
        selectAccountStakeTransactions(state, accountKey),
    );

    const symbol = account?.symbol;
    const isSolana = !!symbol && isSupportedSolStakingNetworkSymbol(symbol);
    const isEthereum = !!symbol && isSupportedEthStakingNetworkSymbol(symbol);

    const timestamp =
        account && hasStakeInPendingDepositedState(account) ? stakeTxs[0]?.blockTime : undefined;

    const { data: validatorQueueData } = useEthereumValidatorsQueue({
        account,
        timestamp,
        enabled: isEthereum,
    });

    if (isSolana) return SOLANA_EPOCH_DAYS;

    return getDaysToAddToPool(stakeTxs, validatorQueueData) ?? DAYS_TO_ADD_TO_POOL_DEFAULT;
};
