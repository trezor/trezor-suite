import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type WalletDescriptor } from '@suite-common/wallet-types';
import { type Result } from '@trezor/type-utils';

import { type EnsureWalletSuiteSyncOnErrors } from '../storage/ensureWalletSuiteSyncOn';

/**
 * @deprecated Intended only for debug & testing
 */
export type DangerouslyWipeAllLabelsFromWalletParams = {
    walletDescriptor: WalletDescriptor;
};

/**
 * @deprecated Intended only for debug & testing
 */
export type DangerouslyWipeAllLabelsFromWallet = (
    params: DangerouslyWipeAllLabelsFromWalletParams,
) => Promise<Result<void, EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError>>;

/**
 * @deprecated Intended only for debug & testing
 */
export type DangerouslyWipeAllLabelsFromWalletDep = {
    dangerouslyWipeAllLabelsFromWallet: DangerouslyWipeAllLabelsFromWallet;
};
