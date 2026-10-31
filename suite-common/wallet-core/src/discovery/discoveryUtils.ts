import { type DiscoveryOutcome, type DiscoveryStatus } from '@suite-common/wallet-types';
import { isDirectRpcBackendType } from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';
import { ERRORS } from '@trezor/connect-common';
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

type FirmwareFailureType = keyof typeof PROTO.Enum_FailureType;

// Connect declares the THP error codes only as a type. The mapped type makes adding a code there a
// compile error here until it is listed.
const THP_ERROR_CODES: Record<
    Exclude<ERRORS.ErrorCode, keyof typeof ERRORS.ERROR_CODES | FirmwareFailureType>,
    true
> = {
    ThpTransportBusy: true,
    ThpUnallocatedChannel: true,
    ThpDecryptionFailed: true,
    ThpDeviceLocked: true,
    ThpUnknownError: true,
};

const REPORTABLE_ERROR_CODES: ReadonlySet<string> = new Set([
    ...Object.keys(ERRORS.ERROR_CODES),
    ...Object.keys(PROTO.Enum_FailureType).filter(key => Number.isNaN(Number(key))),
    ...Object.keys(THP_ERROR_CODES),
]);

/**
 * Analytics may only receive codes from the finite sets of Trezor Connect and firmware failure codes.
 * Anything else, such as the code of an arbitrary thrown error, could carry account or device data.
 */
export const getReportableErrorCode = (code: string | undefined): string =>
    code !== undefined && REPORTABLE_ERROR_CODES.has(code) ? code : UNKNOWN_ERROR_CODE;

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
