import { useSelector } from 'react-redux';

import { SuiteSyncDataRootState, selectSuiteSyncOutputLabel } from '@suite-common/suite-sync';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { isTokenTargetId } from '@suite-common/wallet-core';
import { AccountDescriptor, TxTargetId } from '@suite-common/wallet-types';
import { useNativeServices } from '@suite-native/services';
import { useToast } from '@suite-native/toasts';
import type { StaticSessionId } from '@trezor/connect';
import { exhaustive } from '@trezor/type-utils';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';
import { selectIsLabellingAllowed } from '../selectors';

type TransactionOutputLabelEditableProps = {
    txId: string;
    txTargetId: TxTargetId;
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: AccountDescriptor;
    networkSymbol: NetworkSymbol;
};

export const TransactionOutputLabelEditable = ({
    txId,
    txTargetId,
    deviceStaticSessionId,
    accountDescriptor,
    networkSymbol,
}: TransactionOutputLabelEditableProps) => {
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);
    const { suiteSync } = useNativeServices();
    const { showToast } = useToast();
    const isTokenTxTargetId = isTokenTargetId(txTargetId);

    const label = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncOutputLabel(state, txId, txTargetId, deviceStaticSessionId),
    );

    // Tokens labels wouldn't sync properly between desktop & mobile, so labeling is turned off for tokens until it's fixed.
    if (!isLabellingAllowed || isTokenTxTargetId) {
        return null;
    }

    const onSubmit = async (value: string) => {
        const result = await suiteSync.labeling.updateOutputLabel({
            deviceStaticSessionId,
            txId,
            txTargetId,
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
