import { type SelectedAccountRootState } from '@suite/account';
import {
    type LegacyLabelingVisibleRootState,
    selectIsLegacyLabelingVisible,
    selectLabelingDataForSelectedAccount,
} from '@suite/metadata';
import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type SuiteSyncDataRootState,
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
    selectSuiteSyncAddressLabels,
} from '@suite-common/suite-sync';
import { type Account, type ReceiveInfo } from '@suite-common/wallet-types';

type SelectLabeledUnusedAddressesParams = {
    account: Pick<Account, 'addresses' | 'path' | 'descriptor' | 'deviceState'>;
};

export type SelectLabeledUnusedAddressesState = LegacyLabelingVisibleRootState &
    SelectedAccountRootState &
    WithSuiteSyncAndDeviceState &
    MessageSystemRootState &
    SuiteSyncDataRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<SelectLabeledUnusedAddressesState>();

export const selectLabeledUnusedAddresses = createMemoizedSelector(
    [
        selectIsLegacyLabelingVisible,
        selectLabelingDataForSelectedAccount,
        selectIsSuiteSyncEnabled,
        (
            state: SelectLabeledUnusedAddressesState,
            account: SelectLabeledUnusedAddressesParams['account'],
        ) => selectSuiteSyncAddressLabels(state, account.deviceState),
        (
            _state: SelectLabeledUnusedAddressesState,
            account: SelectLabeledUnusedAddressesParams['account'],
        ) =>
            account.addresses
                ? account.addresses.unused
                : [{ path: account.path, address: account.descriptor }],
    ],
    (
        isLegacyLabelingVisible,
        { addressLabels },
        isSuiteSyncEnabled,
        suiteSyncAddressLabels,
        accountUnusedAddresses,
    ): ReceiveInfo[] =>
        accountUnusedAddresses.reduce<ReceiveInfo[]>((result, candidate) => {
            const suiteSyncLabel = isSuiteSyncEnabled
                ? suiteSyncAddressLabels.find(
                      suiteSyncAddress => suiteSyncAddress.address === candidate.address,
                  )?.label
                : undefined;

            const legacyLabel = isLegacyLabelingVisible
                ? addressLabels[candidate.address]
                : undefined;

            return suiteSyncLabel || legacyLabel
                ? result.concat({
                      path: candidate.path,
                      address: candidate.address,
                      isVerified: false,
                  })
                : result;
        }, []),
);
