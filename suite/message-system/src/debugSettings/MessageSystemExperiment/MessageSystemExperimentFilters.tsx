import { Checkbox, Row } from '@trezor/components';
type MessageSystemExperimentFiltersProps = {
    showActive: boolean;
    onToggleActive: () => void;
};

export const MessageSystemExperimentFilters = ({
    showActive,
    onToggleActive,
}: MessageSystemExperimentFiltersProps) => (
    <Row alignItems="center" justifyContent="flex-end" gap={12}>
        <Checkbox onChange={onToggleActive} isChecked={showActive}>
            Show only active
        </Checkbox>
    </Row>
);
