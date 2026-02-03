import { useSelector } from 'react-redux';

import { SuiteSyncDataRootState, selectSuiteSyncAddressLabel } from '@suite-common/suite-sync';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';
import { useNativeServices } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';
import type { StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';
import { selectIsLabellingAllowed } from '../selectors';

type AddressLabelEditableProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
    testID?: string;
};

export const AddressLabelEditable = ({
    address,
    deviceStaticSessionId,
    accountDescriptor,
    networkSymbol,
    testID,
}: AddressLabelEditableProps) => {
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);
    const { suiteSync } = useNativeServices();
    const { showToast } = useToast();

    const label = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncAddressLabel(state, deviceStaticSessionId, address),
    );

    const onSubmit = async (newLabel: string) => {
        const result = await suiteSync.labeling.updateAddressLabel({
            deviceStaticSessionId,
            address,
            label: newLabel,
            accountDescriptor,
            networkSymbol,
        });

        if (!result.success) {
            const { type } = result.error;
            switch (type) {
                case 'SuiteSyncUnavailableOnDeviceError':
                case 'SuiteSyncFirmwareUpgradeNeededDeviceErrorType':
                case 'DeviceCancelled':
                case 'DeviceError':
                case 'SuiteSyncUpdateError':
                    showToast({ variant: 'error', icon: 'warning', message: type });

                    return;
                case 'WriteModeRequiredForAllocation':
                    // Do nothing, this is expected control flow error when we want allocate on-demand.
                    return;
                default:
                    return exhaustive(type);
            }
        }
    };

    if (!isLabellingAllowed) return null;

    return (
        <EditableLabelLayout label={label} testID={testID}>
            {({ onClose }) => (
                <LabelEditForm
                    label={label ?? ''}
                    onSubmit={newLabel => {
                        onSubmit(newLabel);
                        onClose();
                    }}
                />
            )}
        </EditableLabelLayout>
    );
};
