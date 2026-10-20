import { type EthValidatorsQueue, type StakingBatchDataItem } from '@suite-common/earn-staking-api';
import { type StakingProviderId } from '@suite-common/wallet-config';

export type EthereumStakingBatchItem = Extract<StakingBatchDataItem, { symbol: 'eth' }>;

export type EverstakeEthereumStats = {
    stats?: EthereumStakingBatchItem['stats'];
    validators?: EthValidatorsQueue;
};

export type EthereumProviderStats = EverstakeEthereumStats;

export type EthereumStatsByProvider = Partial<Record<StakingProviderId, EthereumProviderStats>>;
