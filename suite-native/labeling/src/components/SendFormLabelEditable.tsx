import { useSelector } from 'react-redux';

import { Box } from '@suite-native/atoms';

import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';
import { selectIsLabellingAllowed } from '../selectors';

type SendFormLabelEditableProps = {
    label: string | null;
    onLabelChange: (label: string) => void;
};

export const SendFormLabelEditable = ({ onLabelChange, label }: SendFormLabelEditableProps) => {
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);

    if (!isLabellingAllowed) return null;

    return (
        <Box alignItems="flex-end">
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
        </Box>
    );
};
