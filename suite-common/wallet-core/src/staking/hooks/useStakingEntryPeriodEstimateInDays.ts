import { useEthereumValidatorsQueue } from '@suite-common/earn-staking-api';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { SOLANA_EPOCH_DAYS } from '@trezor/network-solana/constants';

import { getDaysToAddToPool } from '../ethereum/ethereumStaking';
import { DAYS_TO_ADD_TO_POOL_DEFAULT } from '../ethereum/ethereumStakingConstants';
import {
    hasStakeInPendingDepositedState,
    isSupportedEthStakingNetworkSymbol,
} from '../ethereum/ethereumStakingUtils';
import { isSupportedSolStakingNetworkSymbol } from '../solana/solanaStakingUtils';

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
