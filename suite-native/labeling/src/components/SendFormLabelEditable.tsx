import { EditableLabelLayout } from './EditableLabelLayout';
import { LabelEditForm } from './LabelEditForm';

type SendFormLabelEditableProps = {
    label: string | null;
    onLabelChange: (label: string) => void;
};

export const SendFormLabelEditable = ({ onLabelChange, label }: SendFormLabelEditableProps) => (
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
