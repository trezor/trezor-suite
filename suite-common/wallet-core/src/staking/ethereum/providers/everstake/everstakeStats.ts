import {
    type EthereumStakingBatchItem,
    type EthereumStatsByProvider,
} from '../../ethereumStakingStats';

// The earn worker still reports the Ethereum batch item as one provider's figures.
export const mapEverstakeBatchItem = ({
    stats,
    validators,
}: EthereumStakingBatchItem): EthereumStatsByProvider => ({
    everstake: { stats, validators },
});
