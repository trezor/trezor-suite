import { type DiscoveryOutcome, type DiscoveryStatus } from '@suite-common/wallet-types';
import { isDirectRpcBackendType } from '@suite-common/wallet-utils';
import { exhaustive } from '@trezor/type-utils';

import { type CreateAccountActionProps } from '../accounts/accountsActions';

export const UNKNOWN_ERROR_CODE = 'Failure_UnknownCode';

const CANCELLATION_ERROR_CODES = ['Method_Cancel', 'Failure_ActionCancelled'];

export const isCancellationErrorCode = (code: string | undefined): boolean =>
    code !== undefined && CANCELLATION_ERROR_CODES.includes(code);

export const getDiscoveryOutcome = (
    discovery: DiscoveryStatus | undefined,
): DiscoveryOutcome | undefined => {
    if (!discovery) return undefined;

    switch (discovery.status) {
        case 'complete':
        case 'failed':
        case 'cancelled':
        case 'passphrase-mismatch':
        case 'passphrase-duplicate':
            return discovery.status;
        case 'starting':
        case 'enter-passphrase':
        case 'progress':
        case 'confirm-empty-passphrase':
            return undefined;
        default:
            return exhaustive(discovery);
    }
};

export const getErrorCode = (error: unknown): string =>
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
        ? error.code
        : UNKNOWN_ERROR_CODE;

/**
 * Discovery on a direct-RPC backend asks only whether an address is used, so an account it turns
 * up still has to be asked what it holds. Blockbook-backed accounts arrive with their tokens.
 */
export const shouldFetchAssetsAfterDiscovery = (account: CreateAccountActionProps) =>
    !account.failed && !account.accountInfo.empty && isDirectRpcBackendType(account.backendType);
