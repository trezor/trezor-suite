import { type Account } from '@suite-common/wallet-types';
import { fromWei } from '@suite-common/wallet-utils';
import { type StakingPool } from '@trezor/blockchain-link-types';
import TrezorConnect from '@trezor/connect';
import { asCoinSymbol } from '@trezor/connect-common';
import { exhaustive } from '@trezor/type-utils';

import { type StakingPosition } from '../positions/positionsTypes';

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

export type EthereumStakingPositionRead =
    { success: true; position: StakingPosition | null } | { success: false; message: string };

export type ReadEthereumStakingPosition = () => Promise<EthereumStakingPositionRead>;

type StakingPositionSource = {
    derivePosition: (account: Account) => StakingPosition | null;
};

type CreateEthereumStakingPositionReaderParams = {
    account: Account;
    adapter: StakingPositionSource;
    identity?: string;
};

// Re-reads the account from the backend and derives the adapter's position from it, so plan and
// sign validate against live state instead of the store.
export const createEthereumStakingPositionReader =
    ({
        account,
        adapter,
        identity,
    }: CreateEthereumStakingPositionReaderParams): ReadEthereumStakingPosition =>
    async () => {
        if (account.networkType !== 'ethereum') {
            return { success: false, message: 'Account is not an Ethereum account.' };
        }

        const accountInfo = await TrezorConnect.getAccountInfo({
            coin: asCoinSymbol(account.symbol),
            identity,
            details: 'tokenBalances',
            descriptor: account.descriptor,
        });

        if (!accountInfo.success) {
            return { success: false, message: accountInfo.error.message };
        }

        const { misc, tokens } = accountInfo.payload;

        const freshAccount: Account = {
            ...account,
            misc: { ...account.misc, stakingPools: misc?.stakingPools ?? [] },
            tokens: tokens ?? account.tokens,
        };

        const position = adapter.derivePosition(freshAccount);

        return { success: true, position };
    };
