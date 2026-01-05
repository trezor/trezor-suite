import { useSelector } from 'react-redux';

import { WithLabelingState, selectOutputLabel } from '@suite-common/suite-sync';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { useNativeServices } from '@suite-native/services';
import type { StaticSessionId } from '@trezor/connect';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';
import { selectIsLabelingEnabled } from '../selectors';

type TransactionOutputLabelEditableProps = {
    txId: string;
    outputIndex: number;
    deviceStaticSessionId: StaticSessionId;
    accountDescriptor: string;
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

    const label = useSelector((state: WithLabelingState) =>
        selectOutputLabel({
            state,
            txId,
            outputIndex,
            deviceStaticSessionId,
        }),
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
