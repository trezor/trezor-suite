import { SuiteSyncAccount } from '@suite-common/suite-sync-storage';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { StaticSessionId } from '@trezor/connect';
import { typedObjectValues } from '@trezor/utils';

import { SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { selectWalletById } from '../wallet/suiteSyncWalletSelectors';

/**
 * @deprecated Do not use this directly outside the `suite-sync` package.
 *             Prefer `selectAccountsWithSuiteSyncLabel` instead.
 */
export const selectSuiteSyncAccounts = (
    state: SuiteSyncDataRootState,
    deviceStaticSessionId: StaticSessionId | null,
): SuiteSyncAccount[] => {
    if (!deviceStaticSessionId) return [];
    const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);
    const wallet = selectWalletById(state, walletDescriptor);
    if (!wallet) return [];

    return typedObjectValues(wallet.accounts);
};
