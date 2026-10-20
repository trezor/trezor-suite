import { type NetworkSymbol } from '@suite-common/wallet-config';
import { fromWei } from '@suite-common/wallet-utils';
import { type StakingPool } from '@trezor/blockchain-link-types';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { exhaustive } from '@trezor/type-utils';

export type EthereumStakingPoolLiveState = Partial<
    Pick<StakingPool, 'autocompoundBalance' | 'withdrawTotalAmount' | 'claimableAmount'>
>;

export type EthereumStakingLiveStateReason =
    | { code: 'ACCOUNT_INFO_FAILED'; message: string }
    | { code: 'AUTOCOMPOUND_BALANCE_MISSING' }
    | { code: 'MAX_AMOUNT_FOR_UNSTAKE'; maxAmount: string }
    | { code: 'CLAIM_AMOUNTS_MISSING' }
    | { code: 'NO_AMOUNT_REQUESTED_FOR_UNSTAKE' }
    | { code: 'UNSTAKE_REQUEST_NOT_FILLED' }
    | { code: 'MISSING_UNSTAKE_AMOUNT' };

export type EthereumStakingLiveStateValidation =
    { isValid: true } | { isValid: false; reason: EthereumStakingLiveStateReason };

export const VALID_ETHEREUM_STAKING_LIVE_STATE: EthereumStakingLiveStateValidation = {
    isValid: true,
};

export const invalidEthereumStakingLiveState = (
    reason: EthereumStakingLiveStateReason,
): EthereumStakingLiveStateValidation => ({
    isValid: false,
    reason,
});

// Maps a typed reason back to the legacy English message so desktop's existing toast text is unchanged.
export const getEthereumStakingLiveStateErrorMessage = (
    reason: EthereumStakingLiveStateReason,
): string => {
    switch (reason.code) {
        case 'ACCOUNT_INFO_FAILED':
            return reason.message;
        case 'AUTOCOMPOUND_BALANCE_MISSING':
            return 'Failed to get the autocompound balance';
        case 'MAX_AMOUNT_FOR_UNSTAKE':
            return `Max Amount For Unstake ${reason.maxAmount}`;
        case 'CLAIM_AMOUNTS_MISSING':
            return 'Failed to get the claimable or withdraw total amount';
        case 'NO_AMOUNT_REQUESTED_FOR_UNSTAKE':
            return 'No amount requested for unstake';
        case 'UNSTAKE_REQUEST_NOT_FILLED':
            return 'Unstake request not filled yet';
        case 'MISSING_UNSTAKE_AMOUNT':
            return 'Missing unstake amount for live-state validation';
        default:
            return exhaustive(reason);
    }
};

export const weiToEtherBigNumber = (wei: string) => fromWei(wei).toEther('bignumber');

export type EthereumStakingPoolsRead =
    { success: true; stakingPools: StakingPool[] } | { success: false; message: string };

export type ReadEthereumStakingPools = () => Promise<EthereumStakingPoolsRead>;

type ReadEthereumStakingPoolsParams = {
    symbol: NetworkSymbol;
    descriptor: string;
    identity?: string;
};

export const readEthereumStakingPools = async ({
    symbol,
    descriptor,
    identity,
}: ReadEthereumStakingPoolsParams): Promise<EthereumStakingPoolsRead> => {
    const accountInfo = await TrezorConnect.getAccountInfo({
        coin: asCoinSymbol(symbol),
        identity,
        details: 'tokenBalances',
        descriptor,
    });

    if (!accountInfo.success) {
        return { success: false, message: accountInfo.error.message };
    }

    return { success: true, stakingPools: accountInfo.payload?.misc?.stakingPools ?? [] };
};
