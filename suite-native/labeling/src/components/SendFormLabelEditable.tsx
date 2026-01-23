import { useSelector } from 'react-redux';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';
import { selectSuiteSyncLabelingEnabled } from '../selectors';

type SendFormLabelEditableProps = {
    label: string | null;
    onLabelChange: (label: string) => void;
};

export const SendFormLabelEditable = ({ onLabelChange, label }: SendFormLabelEditableProps) => {
    const isLabelingEnabled = useSelector(selectSuiteSyncLabelingEnabled);

    if (!isLabelingEnabled) {
        return null;
    }

    return (
        <EditableLabelLayout label={label}>
            {({ onClose }) => (
                <LabelEditForm
                    label={label}
                    onSubmit={newLabel => {
                        onLabelChange(newLabel);
                        onClose();
                    }}
                />
            )}
        </EditableLabelLayout>
    );
};
