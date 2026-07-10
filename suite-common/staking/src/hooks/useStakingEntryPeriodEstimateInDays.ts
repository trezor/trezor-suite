import { useEthereumValidatorsQueue } from '@suite-common/earn-staking-api';
import { DAYS_TO_ADD_TO_POOL_DEFAULT } from '@suite-common/wallet-constants';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import {
    hasStakeInPendingDepositedState,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { SOLANA_EPOCH_DAYS } from '@trezor/network-solana/constants';

import { getDaysToAddToPool } from '../utils/ethereumStaking';

type UseStakingEntryPeriodEstimateInDaysParams = {
    account: Account | null;
    stakeTxs: WalletAccountTransaction[];
};

export const useStakingEntryPeriodEstimateInDays = ({
    account,
    stakeTxs,
}: UseStakingEntryPeriodEstimateInDaysParams) => {
    const symbol = account?.symbol;
    const isSolana = !!symbol && isSupportedSolStakingNetworkSymbol(symbol);
    const isEthereum = !!symbol && isSupportedEthStakingNetworkSymbol(symbol);

    const timestamp =
        account && hasStakeInPendingDepositedState(account) ? stakeTxs[0]?.blockTime : undefined;

    // As a hook, this must be called unconditionally; the query itself is only
    // enabled for Ethereum, so no request is made for Solana.
    const { data: validatorQueueData } = useEthereumValidatorsQueue(
        { account, timestamp },
        { enabled: isEthereum },
    );

    if (isSolana) return SOLANA_EPOCH_DAYS;

    return getDaysToAddToPool(stakeTxs, validatorQueueData) ?? DAYS_TO_ADD_TO_POOL_DEFAULT;
};
