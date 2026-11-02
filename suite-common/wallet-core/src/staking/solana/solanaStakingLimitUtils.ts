import { type Account } from '@suite-common/wallet-types';
import { MAX_CLAIM_ACCOUNTS, StakeState } from '@trezor/network-solana/constants';
import solana from '@trezor/network-solana/runtime';
import { BigNumber } from '@trezor/utils';

import { getSolanaStakingAccountsByStatus } from './solanaStakingUtils';
import { WALLET_SDK_SOURCE } from '../shared/stakingConstants';

export type SolanaStakingLimitType = 'claim' | 'unstake';

type ResolveSolanaStakingLimitParams =
    | {
          type: 'unstake';
          outputAmount: string;
          unstakeAmount: string;
      }
    | {
          type: 'claim';
          totalClaimAmount: string;
          deactivatedAccountCount: number;
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

    const { totalClaimAmount, deactivatedAccountCount } = params;

    // A claim withdraws whole accounts, so only their number can exceed one transaction. The
    // on-chain balance may differ from "stake plus rent" and must not drive the decision.
    return {
        isLimitExceeded: deactivatedAccountCount > MAX_CLAIM_ACCOUNTS,
        estimatedAmount: totalClaimAmount,
    };
};

export const getSolanaDeactivatedAccountCount = (account: Account): number =>
    getSolanaStakingAccountsByStatus(account, StakeState.Deactivated).length;

type EstimateSolanaStakingLimitParams = {
    descriptor: string;
    deactivatedAccountCount: number;
    blockchainUrl: string;
    userAgent: string;
    type: SolanaStakingLimitType;
    outputAmount: string;
};

export const estimateSolanaStakingLimit = async ({
    descriptor,
    deactivatedAccountCount,
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
        totalClaimAmount: totalClaimAmount.toString(),
        deactivatedAccountCount,
    });
};
