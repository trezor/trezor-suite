import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { type SuiteSyncAccount } from '@suite-common/suite-sync-storage';
import { type StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';
import { typedObjectValues } from '@trezor/utils';

import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { selectWalletById } from '../wallet/suiteSyncWalletSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncDataRootState>();

/**
 * @deprecated Do not use this directly outside the `suite-sync` package.
 *             Prefer `selectAccountsWithSuiteSyncLabel` instead.
 */
export const selectSuiteSyncAccounts = createMemoizedSelector(
    [
        (state: SuiteSyncDataRootState, deviceStaticSessionId: StaticSessionId | null) =>
            selectWalletById(
                state,
                deviceStaticSessionId
                    ? parseStaticSessionId(deviceStaticSessionId).walletDescriptor
                    : null,
            ),
    ],
    (wallet): SuiteSyncAccount[] => {
        if (!wallet) return returnStableArrayIfEmpty<SuiteSyncAccount>();

        return returnStableArrayIfEmpty(typedObjectValues(wallet.accounts));
    },
);
