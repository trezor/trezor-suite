import { CATEGORY_FILTER_OPTIONS } from '@suite-common/message-system';
import { Box, CheckBox, Select, Text, VStack } from '@suite-native/atoms';

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
    <VStack spacing="sp12">
        <Select<CategoryFilterOption>
            title="Category"
            items={[...CATEGORY_FILTER_OPTIONS]}
            value={selectedCategory}
            onSelectItem={onCategoryChange}
            labelType="innerLabel"
        />
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
            <Text>Show only active</Text>
            <CheckBox isChecked={showActive} onChange={onToggleActive} />
        </Box>
    </VStack>
);
