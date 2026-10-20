import { useEthereumValidatorsQueue } from '@suite-common/earn-staking-api';
import { type Account, type WalletAccountTransaction } from '@suite-common/wallet-types';
import { SOLANA_EPOCH_DAYS } from '@trezor/network-solana/constants';

import {
    hasStakeInPendingDepositedState,
    isSupportedEthStakingNetworkSymbol,
} from '../ethereum/ethereumStakingUtils';
import {
    DEFAULT_ETHEREUM_STAKING_PROVIDER_ID,
    getEthereumStakingAdapter,
} from '../ethereum/providers/ethereumStakingProviders';
import { isSupportedSolStakingNetworkSymbol } from '../solana/solanaStakingUtils';

type UseStakingEntryPeriodEstimateInDaysParams = {
    account: Account | null;
    stakeTxs: WalletAccountTransaction[];
};

const NO_UNSTAKE_TXS: WalletAccountTransaction[] = [];

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

    const adapter = getEthereumStakingAdapter(DEFAULT_ETHEREUM_STAKING_PROVIDER_ID);
    const { entryDays } = adapter.timelines(
        { validators: validatorQueueData },
        { stakeTxs, unstakeTxs: NO_UNSTAKE_TXS },
    );

    return entryDays ?? adapter.timelineDefaults.entryDays;
};
