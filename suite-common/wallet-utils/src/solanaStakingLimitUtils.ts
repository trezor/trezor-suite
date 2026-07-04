import { WALLET_SDK_SOURCE } from '@suite-common/wallet-constants';
import { type Account } from '@suite-common/wallet-types';
import { StakeState } from '@trezor/coins-solana/constants';
import solana from '@trezor/coins-solana/runtime';
import { BigNumber } from '@trezor/utils';

import { getSolanaStakingAccountsByStatus } from './solanaStakingUtils';

export type SolanaStakingLimitType = 'claim' | 'unstake';

type ResolveSolanaStakingLimitParams =
    | {
          type: 'unstake';
          outputAmount: string;
          unstakeAmount: string;
      }
    | {
          type: 'claim';
          outputAmount: string;
          totalClaimAmount: string;
          rentExemptReserves: string[];
      };

export type SolanaStakingLimit = {
    isLimitExceeded: boolean;
    estimatedAmount: string;
};

export const resolveSolanaStakingLimit = (
    params: ResolveSolanaStakingLimitParams,
): SolanaStakingLimit => {
    if (params.type === 'unstake') {
        const { outputAmount, unstakeAmount } = params;

        return {
            isLimitExceeded: new BigNumber(unstakeAmount).lt(outputAmount),
            estimatedAmount: unstakeAmount,
        };
    }

    const { outputAmount, totalClaimAmount, rentExemptReserves } = params;

    const claimableAmount = rentExemptReserves.reduce(
        (acc, reserve) => acc.minus(reserve),
        new BigNumber(totalClaimAmount),
    );

    return {
        isLimitExceeded: claimableAmount.lt(outputAmount),
        estimatedAmount: totalClaimAmount,
    };
};

export const getSolanaDeactivatedRentReserves = (account: Account): string[] =>
    getSolanaStakingAccountsByStatus(account, StakeState.Deactivated).map(
        ({ rentExemptReserve }) => rentExemptReserve,
    );

type EstimateSolanaStakingLimitParams = {
    descriptor: string;
    deactivatedRentReserves: string[];
    blockchainUrl: string;
    userAgent: string;
    type: SolanaStakingLimitType;
    outputAmount: string;
};

export const estimateSolanaStakingLimit = async ({
    descriptor,
    deactivatedRentReserves,
    blockchainUrl,
    userAgent,
    type,
    outputAmount,
}: EstimateSolanaStakingLimitParams): Promise<SolanaStakingLimit> => {
    const { selectSolanaConnection, unstake, claim } = await solana();
    const connection = selectSolanaConnection(blockchainUrl, userAgent);

    if (type === 'unstake') {
        const { unstakeAmount } = await unstake({
            connection,
            sender: descriptor,
            lamports: BigInt(outputAmount),
            source: WALLET_SDK_SOURCE,
        });

        return resolveSolanaStakingLimit({
            type,
            outputAmount,
            unstakeAmount: unstakeAmount.toString(),
        });
    }

    const { totalClaimAmount } = await claim({ connection, sender: descriptor });

    return resolveSolanaStakingLimit({
        type,
        outputAmount,
        totalClaimAmount: totalClaimAmount.toString(),
        rentExemptReserves: deactivatedRentReserves,
    });
};
