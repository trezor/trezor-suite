import { type Account } from '@suite-common/wallet-types';
import { getTronStakingInfo, sunToTrx } from '@suite-common/wallet-utils';
import { type TronVote } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import {
    type TronStakingProduct,
    isTronProductSuperRepresentative,
    listTronStakingProducts,
} from './tronStakingProducts';
import { type StakingPosition, type StakingPositionDetails } from '../../positions/positionsTypes';

const sumVotes = (votes: TronVote[]) =>
    votes.reduce((total, vote) => total.plus(vote.voteCount), new BigNumber(0));

type CreateTronPositionParams = {
    account: Account;
    product: TronStakingProduct | null;
    staked: BigNumber;
    unstaking: BigNumber;
    rewards: BigNumber | null;
    details: StakingPositionDetails;
};

// Whether an unfreeze batch can be withdrawn depends on the clock, so `claimable` stays zero and
// the batches are resolved when read.
const createTronPosition = ({
    account,
    product,
    staked,
    unstaking,
    rewards,
    details,
}: CreateTronPositionParams): StakingPosition => ({
    accountKey: account.key,
    productId: product?.id ?? null,
    providerId: product?.providerId ?? null,
    symbol: account.symbol,
    asset: product?.asset ?? account.symbol,
    kind: product?.kind ?? 'native',
    staked: staked.toFixed(),
    withdrawable: staked.toFixed(),
    pendingStake: '0',
    activating: '0',
    unstaking: unstaking.toFixed(),
    claimable: '0',
    rewards: rewards?.toFixed() ?? null,
    claimableRewards: rewards?.toFixed() ?? '0',
    canClaim: false,
    total: staked.plus(unstaking).toFixed(),
    contributesToNativeBalance: true,
    details,
});

// Frozen TRX backs the votes for all Super Representatives at once. Each product holds its
// representatives' votes; what no product holds (unvoted stake, other representatives, unfreeze
// batches, rewards) goes to one unattributed position.
export const deriveTronStakingPositions = (account: Account): StakingPosition[] => {
    if (account.networkType !== 'tron') return [];

    const stakingInfo = getTronStakingInfo(account);

    if (!stakingInfo) return [];

    const toTrx = (sun: string) => new BigNumber(sunToTrx(sun, account.symbol));
    const products = listTronStakingProducts(account.symbol);

    const productPositions = products.flatMap(product => {
        const votes = stakingInfo.votes.filter(vote =>
            isTronProductSuperRepresentative(product, vote.address),
        );
        const staked = sumVotes(votes);

        if (staked.lte(0)) return [];

        return [
            createTronPosition({
                account,
                product,
                staked,
                unstaking: new BigNumber(0),
                rewards: null,
                details: { type: 'tron-votes', votes },
            }),
        ];
    });

    const otherVotes = stakingInfo.votes.filter(
        vote => !products.some(product => isTronProductSuperRepresentative(product, vote.address)),
    );
    const attributed = productPositions.reduce(
        (total, position) => total.plus(position.staked),
        new BigNumber(0),
    );
    const unattributedStake = BigNumber.max(toTrx(stakingInfo.stakedBalance).minus(attributed), 0);
    const unstaking = toTrx(
        stakingInfo.unstakingBatches
            .reduce((total, batch) => total.plus(batch.amount), new BigNumber(0))
            .toFixed(),
    );
    const rewards = toTrx(stakingInfo.unclaimedReward);

    const hasUnattributedStake = [unattributedStake, unstaking, rewards].some(amount =>
        amount.gt(0),
    );

    if (!hasUnattributedStake) return productPositions;

    return [
        ...productPositions,
        createTronPosition({
            account,
            product: null,
            staked: unattributedStake,
            unstaking,
            rewards,
            details: {
                type: 'tron-unattributed',
                votes: otherVotes,
                unstakingBatches: stakingInfo.unstakingBatches,
            },
        }),
    ];
};
