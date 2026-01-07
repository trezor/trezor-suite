import { useSelector } from 'react-redux';

import { SuiteSyncDataRootState, selectSuiteSyncOutputLabel } from '@suite-common/suite-sync';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { AccountDescriptor } from '@suite-common/wallet-types';
import { useNativeServices } from '@suite-native/services';
import type { StaticSessionId } from '@trezor/connect';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';
import { selectIsLabelingEnabled } from '../selectors';

type TransactionOutputLabelEditableProps = {
    txId: string;
    outputIndex: number;
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
    const isLabelingEnabled = useSelector(selectIsLabelingEnabled);
    const { suiteSync } = useNativeServices();

    const label = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncOutputLabel(state, txId, outputIndex, deviceStaticSessionId),
    );

    if (!isLabelingEnabled) {
        return null;
    }

    return (
        <EditableLabelLayout label={label}>
            {({ onClose }) => (
                <LabelEditForm
                    label={label ?? ''}
                    onSubmit={value => {
                        suiteSync.labeling.updateOutputLabel({
                            deviceStaticSessionId,
                            txId,
                            outputIndex,
                            label: value,
                            accountDescriptor,
                            networkSymbol,
                        });
                        onClose();
                    }}
                />
            )}
        </EditableLabelLayout>
    );
};
