import { CATEGORY_FILTER_OPTIONS } from '@suite-common/message-system';
import { Checkbox, Row, SelectBar } from '@trezor/components';
import { spacings } from '@trezor/theme';

export type CategoryFilterOption = (typeof CATEGORY_FILTER_OPTIONS)[number]['value'];

type MessageSystemManagerFiltersProps = {
    showActive: boolean;
    onToggleActive: () => void;
    selectedCategory: CategoryFilterOption;
    onCategoryChange: (value: CategoryFilterOption) => void;
};

export const MessageSystemManagerFilters = ({
    showActive,
    onToggleActive,
    selectedCategory,
    onCategoryChange,
}: MessageSystemManagerFiltersProps) => (
    <Row alignItems="center" justifyContent="space-between" gap={spacings.sm}>
        <SelectBar
            selectedOption={selectedCategory}
            options={[...CATEGORY_FILTER_OPTIONS]}
            size="small"
            onChange={onCategoryChange}
        />
        <Checkbox onChange={onToggleActive} isChecked={showActive}>
            Show only active
        </Checkbox>
    </Row>
);
