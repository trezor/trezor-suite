import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { G } from '@mobily/ts-belt';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Radio } from '../Radio';
import { Text } from '../Text';

export type SelectItemValue = string | number;
export type SelectItemProps = {
    label: string;
    value: SelectItemValue;
    onSelect: () => void;
    isSelected: boolean;
    isLastChild?: boolean;
    icon: ReactNode;
};

type SelectItemStyleProps = {
    isLastChild: boolean;
    isSelected: boolean;
};
const selectItemStyle = prepareNativeStyle(() => ({
    flexDirection: 'row',
    alignItems: 'center',
}));

const underlineSectionStyle = prepareNativeStyle<SelectItemStyleProps>(
    (utils, { isLastChild, isSelected }) => ({
        flexDirection: 'row',
        justifyContent: 'space-between',
        flex: 1,
        color: utils.colors.textSubdued,
        paddingVertical: 20,
        marginLeft: 10,
        borderBottomWidth: utils.borders.widths.small,
        borderColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
        extend: [
            {
                condition: isLastChild,
                style: {
                    borderBottomWidth: 0,
                },
            },
            {
                condition: isSelected,
                style: {
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
    isLastChild = false,
}: SelectItemProps) => {
    const { applyStyle } = useNativeStyles();

    if (G.isNullable(value)) return null;

    return (
        <TouchableOpacity
            style={applyStyle(selectItemStyle)}
            onPress={onSelect}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={label}
        >
            {icon}
            <Box style={applyStyle(underlineSectionStyle, { isLastChild, isSelected })}>
                <Text numberOfLines={1}>{label}</Text>
                <Radio value={value} onPress={onSelect} isChecked={isSelected} />
            </Box>
        </TouchableOpacity>
    );
};
