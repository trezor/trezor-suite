import { Account } from '@wallet-types';
import { useSelector } from '@suite-hooks';

export const useCardanoStakingStatus = (account?: Account) => {
    const cardanoNetwork = account && account.symbol === 'ada' ? 'mainnet' : 'preview';
    const { trezorPools, isFetchLoading } = useSelector(
        state => state.wallet.cardanoStaking[cardanoNetwork],
    );

    if (!account?.misc || !('staking' in account?.misc)) return false;

    const { poolId } = account.misc.staking;
    const currentPool =
        poolId && trezorPools ? trezorPools?.pools.find(p => p.bech32 === poolId) : null;
    const isStakingOnTrezorPool = !isFetchLoading ? !!currentPool : true;

    return !account.misc.staking.isActive || !isStakingOnTrezorPool;
};
