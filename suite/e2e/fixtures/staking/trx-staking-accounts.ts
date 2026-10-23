import {
    TRX_BEST_BLOCK,
    TRX_FIRST_ACCOUNT_ADDRESS,
    TRX_FUNDING_TX,
    TRX_MOCKED_ACCOUNT,
    TRX_MOCKED_RESOURCES,
    TRX_RESOURCE_LIMITS,
    buildTrxStakingTx,
} from '../../support/mocks/trx-endpoints';

type TrxFrozenAccountParams = {
    // Frozen amount in TRX and in Sun.
    stakeAmount: string;
    stakeAmountSun: string;
    freezeTxid: string;
};

type TrxVotedAccountParams = TrxFrozenAccountParams & {
    voteTxid: string;
    representativeAddress: string;
};

// Bandwidth gained by freezing `stakeAmount` TRX on the mocked network.
export const getTrxBandwidthGain = (stakeAmount: string) =>
    Math.round(
        (Number(stakeAmount) * TRX_RESOURCE_LIMITS.totalBandwidthLimit) /
            TRX_RESOURCE_LIMITS.totalBandwidthWeight,
    );

const buildFrozenResources = ({ stakeAmount, stakeAmountSun }: TrxFrozenAccountParams) => {
    const bandwidthGain = getTrxBandwidthGain(stakeAmount);

    return {
        ...TRX_MOCKED_RESOURCES,
        availableStakedBandwidth: bandwidthGain,
        totalStakedBandwidth: bandwidthGain,
        stakingInfo: {
            ...TRX_MOCKED_RESOURCES.stakingInfo!,
            stakedBalance: stakeAmountSun,
            stakedBalanceBandwidth: stakeAmountSun,
            totalVotingPower: stakeAmount,
            availableVotingPower: stakeAmount,
        },
    };
};

// The first account after a confirmed freeze of `stakeAmount` TRX for bandwidth, with no votes
// assigned yet.
export const buildTrxFrozenAccountState = (params: TrxFrozenAccountParams) => {
    const freezeTx = buildTrxStakingTx({
        txid: params.freezeTxid,
        address: TRX_FIRST_ACCOUNT_ADDRESS,
        blockHeight: TRX_BEST_BLOCK.height + 1,
        payload: {
            contractType: 'FreezeBalanceV2Contract',
            operation: 'freeze',
            resource: 'BANDWIDTH',
            stakeAmount: params.stakeAmountSun,
        },
    });

    return {
        balance: (BigInt(TRX_MOCKED_ACCOUNT.balance) - BigInt(params.stakeAmountSun)).toString(),
        txs: 2,
        nonTokenTxs: 2,
        transactions: [freezeTx, TRX_FUNDING_TX],
        chainExtraData: { payloadType: 'tron', payload: buildFrozenResources(params) },
    };
};

// The frozen account after a confirmed vote assigning all voting power to one representative.
export const buildTrxVotedAccountState = (params: TrxVotedAccountParams) => {
    const frozenAccountState = buildTrxFrozenAccountState(params);
    const frozenResources = buildFrozenResources(params);
    const voteTx = buildTrxStakingTx({
        txid: params.voteTxid,
        address: TRX_FIRST_ACCOUNT_ADDRESS,
        blockHeight: TRX_BEST_BLOCK.height + 2,
        payload: {
            contractType: 'VoteWitnessContract',
            operation: 'vote',
            votes: [{ address: params.representativeAddress, count: params.stakeAmount }],
        },
    });

    return {
        ...frozenAccountState,
        txs: 3,
        nonTokenTxs: 3,
        transactions: [voteTx, ...frozenAccountState.transactions],
        chainExtraData: {
            payloadType: 'tron',
            payload: {
                ...frozenResources,
                stakingInfo: {
                    ...frozenResources.stakingInfo,
                    availableVotingPower: '0',
                    votes: [
                        { address: params.representativeAddress, voteCount: params.stakeAmount },
                    ],
                },
            },
        },
    };
};
