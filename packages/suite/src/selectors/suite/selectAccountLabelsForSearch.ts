import {
    fromLegacyMetadataToSearchAccountLabels,
    selectLabelingDataForAccount,
} from '@suite/metadata';
import {
    fromSuiteSyncToSearchAccountLabels,
    selectAllLabelsForAccount,
    selectIsSuiteSyncEnabled,
} from '@suite-common/suite-sync';
import { Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

import { AppState } from 'src/types/suite';

export const selectAccountLabelsForSearch = (state: AppState, account: Account) => {
    const isSuiteSyncEnabled = selectIsSuiteSyncEnabled(state);

    if (isSuiteSyncEnabled) {
        const { walletDescriptor } = parseDeviceStaticSessionId(account.deviceState);
        const allLabels = selectAllLabelsForAccount(state, {
            walletDescriptor,
            accountDescriptor: account.descriptor,
            networkSymbol: account.symbol,
        });

        return fromSuiteSyncToSearchAccountLabels(allLabels);
    }

    const accountMetadata = selectLabelingDataForAccount(state, account.key);

    return fromLegacyMetadataToSearchAccountLabels(accountMetadata);
};
