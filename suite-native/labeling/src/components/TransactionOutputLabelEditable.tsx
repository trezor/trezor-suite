import { useSelector } from 'react-redux';

import { SuiteSyncDataRootState, selectSuiteSyncOutputLabel } from '@suite-common/suite-sync';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';
import { useNativeServices } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';
import type { StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';
import { selectIsLabellingAllowed } from '../selectors';

type TransactionOutputLabelEditableProps = {
    txId: string;
    outputIndex: string;
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export const TransactionOutputLabelEditable = ({
    txId,
    outputIndex,
    deviceStaticSessionId,
    accountDescriptor,
    networkSymbol,
}: TransactionOutputLabelEditableProps) => {
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);
    const { suiteSync } = useNativeServices();
    const { showToast } = useToast();

    const label = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncOutputLabel(state, txId, outputIndex, deviceStaticSessionId),
    );

    if (!isLabellingAllowed) {
        return null;
    }

    const onSubmit = async (value: string) => {
        const result = await suiteSync.labeling.updateOutputLabel({
            deviceStaticSessionId,
            txId,
            outputIndex,
            label: value,
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

    return (
        <EditableLabelLayout label={label}>
            {({ onClose }) => (
                <LabelEditForm
                    label={label ?? ''}
                    onSubmit={value => {
                        onSubmit(value);
                        onClose();
                    }}
                />
            )}
        </EditableLabelLayout>
    );
};
