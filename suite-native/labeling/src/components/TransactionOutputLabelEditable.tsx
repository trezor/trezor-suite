import { useDispatch, useSelector } from 'react-redux';

import {
    WithLabelingState,
    selectOutputLabel,
    updateOutputLabelThunk,
} from '@suite-common/local-first-storage';
import type { StaticSessionId } from '@trezor/connect';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';
import { useIsLabelingEnabled } from './useIsLabelingEnabled';

type TransactionOutputLabelEditableProps = {
    txId: string;
    outputIndex: number;
    deviceStaticSessionId: StaticSessionId;
};

export const TransactionOutputLabelEditable = ({
    txId,
    outputIndex,
    deviceStaticSessionId,
}: TransactionOutputLabelEditableProps) => {
    const isLabelingEnabled = useIsLabelingEnabled();
    const dispatch = useDispatch();

    const label =
        useSelector((state: WithLabelingState) =>
            selectOutputLabel({
                state,
                txId,
                outputIndex,
                deviceStaticSessionId,
            }),
        )?.label ?? null;

    if (!isLabelingEnabled) {
        return null;
    }

    return (
        <EditableLabelLayout label={label}>
            {({ onClose }) => (
                <LabelEditForm
                    label={label ?? ''}
                    onSubmit={value => {
                        dispatch(
                            updateOutputLabelThunk({
                                deviceStaticSessionId,
                                txId,
                                outputIndex,
                                label: value,
                            }),
                        );
                        onClose();
                    }}
                />
            )}
        </EditableLabelLayout>
    );
};
