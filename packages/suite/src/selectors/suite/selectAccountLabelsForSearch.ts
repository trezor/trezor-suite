import {
    type MetadataRootState,
    fromLegacyMetadataToSearchAccountLabels,
    selectLabelingDataForAccount,
} from '@suite/metadata';
import { type DeviceRootState } from '@suite-common/device';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type SuiteSyncDataRootState,
    type WithSuiteSyncState,
    fromSuiteSyncToSearchAccountLabels,
    selectAllLabelsForAccount,
    selectIsSuiteSyncEnabled,
} from '@suite-common/suite-sync';
import { type Account } from '@suite-common/wallet-types';
import { parseStaticSessionId } from '@trezor/device-utils';

export type SelectAccountLabelsForSearchState = DeviceRootState &
    MessageSystemRootState &
    MetadataRootState &
    SuiteSyncDataRootState &
    WithSuiteSyncState;

const createMemoizedSelector = createWeakMapSelector.withTypes<SelectAccountLabelsForSearchState>();

export const selectAccountLabelsForSearch = createMemoizedSelector(
    [
        selectIsSuiteSyncEnabled,
        (state: SelectAccountLabelsForSearchState, account: Account) =>
            selectAllLabelsForAccount(state, {
                walletDescriptor: parseStaticSessionId(account.deviceState).walletDescriptor,
                accountDescriptor: account.descriptor,
                networkSymbol: account.symbol,
            }),
        (state: SelectAccountLabelsForSearchState, account: Account) =>
            selectLabelingDataForAccount(state, account.key),
    ],
    (isSuiteSyncEnabled, allLabels, accountMetadata) => {
        if (isSuiteSyncEnabled) {
            return fromSuiteSyncToSearchAccountLabels(allLabels);
        }

        return fromLegacyMetadataToSearchAccountLabels(accountMetadata);
    },
);
