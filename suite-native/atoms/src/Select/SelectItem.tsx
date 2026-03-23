import { type ReactNode } from 'react';

import { G } from '@mobily/ts-belt';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { Box } from '../Box';
import { PressableOpacity } from '../Pressable';
import { Radio } from '../Radio';
import { HStack } from '../Stack';
import { Text } from '../Text';

export type SelectItemValue = string | number;
export type SelectItemProps = {
    label: string;
    value: SelectItemValue;
    onSelect: () => void;
    isSelected: boolean;
    icon?: ReactNode;
    badge?: ReactNode;
};

type SelectItemStyleProps = {
    isSelected: boolean;
};

const selectItemStyle = prepareNativeStyle(utils => ({
    ...utils.boxShadows.small,
}));

const selectItemContentStyle = prepareNativeStyle<SelectItemStyleProps>(
    (utils, { isSelected }) => ({
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        margin: utils.spacings.sp1, // prevents layout shift after selection
        padding: utils.spacings.sp16,
        borderWidth: utils.borders.widths.small,
        borderRadius: utils.borders.radii.r12,
        borderColor: utils.colors.borderOnElevation1,
        backgroundColor: utils.colors.backgroundSurfaceElevation1,
        color: utils.colors.textDefault,
        extend: [
            {
                condition: isSelected,
                style: {
                    margin: 0,
                    borderWidth: utils.borders.widths.large,
                    borderColor: utils.colors.backgroundPrimaryDefault,
                    color: utils.colors.textDefault,
                },
            },
        ],
    }),
);

export const SelectItem = ({
    label,
    value,
    onSelect,
    isSelected,
    icon,
    badge,
}: SelectItemProps) => {
    const { applyStyle } = useNativeStyles();

    if (G.isNullable(value)) return null;

    return (
        <PressableOpacity
            style={applyStyle(selectItemStyle)}
            onPress={onSelect}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={label}
            testID={`@select/item/${value}`}
        >
            <Box
                style={applyStyle(selectItemContentStyle, { isSelected })}
                testID={`@select/item/${value}/content`}
            >
                <HStack>
                    {icon}
                    <Text numberOfLines={1}>{label}</Text>
                </HStack>
                <HStack spacing="sp12">
                    {badge}
                    <Radio value={value} onPress={onSelect} isChecked={isSelected} />
                </HStack>
            </Box>
        </PressableOpacity>
    );
};
