import { Checkbox, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

type MessageSystemExperimentFiltersProps = {
    showActive: boolean;
    onToggleActive: () => void;
};

export const MessageSystemExperimentFilters = ({
    showActive,
    onToggleActive,
}: MessageSystemExperimentFiltersProps) => (
    <Row alignItems="center" justifyContent="flex-end" gap={spacings.sm}>
        <Checkbox onChange={onToggleActive} isChecked={showActive}>
            Show only active
        </Checkbox>
    </Row>
);
