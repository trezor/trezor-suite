import {
    fromLegacyMetadataToSearchAccountLabels,
    selectLabelingDataForAccount,
} from '@suite/metadata';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    fromSuiteSyncToSearchAccountLabels,
    selectAllLabelsForAccount,
    selectIsSuiteSyncEnabled,
} from '@suite-common/suite-sync';
import { type Account } from '@suite-common/wallet-types';
import { parseStaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/types/suite';

const createMemoizedSelector = createWeakMapSelector.withTypes<AppState>();

export const selectAccountLabelsForSearch = createMemoizedSelector(
    [
        selectIsSuiteSyncEnabled,
        (state: AppState, account: Account) =>
            selectAllLabelsForAccount(state, {
                walletDescriptor: parseStaticSessionId(account.deviceState).walletDescriptor,
                accountDescriptor: account.descriptor,
                networkSymbol: account.symbol,
            }),
        (state: AppState, account: Account) => selectLabelingDataForAccount(state, account.key),
    ],
    (isSuiteSyncEnabled, allLabels, accountMetadata) => {
        if (isSuiteSyncEnabled) {
            return fromSuiteSyncToSearchAccountLabels(allLabels);
        }

        return fromLegacyMetadataToSearchAccountLabels(accountMetadata);
    },
);
