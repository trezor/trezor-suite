import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from '../Box';
import { Radio } from '../Radio';
import { Text } from '../Text';

export type SelectValue = string | number | null;
export type SelectItemProps = {
    label: string;
    value: SelectValue;
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
        color: utils.colors.gray700,
        paddingVertical: 20,
        marginLeft: 10,
        borderBottomWidth: utils.borders.widths.small,
        borderColor: utils.colors.gray300,
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
                    color: utils.colors.black,
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

    if (!value) return null;

    return (
        <TouchableOpacity style={applyStyle(selectItemStyle)} onPress={onSelect}>
            {icon}
            <Box style={applyStyle(underlineSectionStyle, { isLastChild, isSelected })}>
                <Text numberOfLines={1}>{label}</Text>
                <Radio value={value} onPress={onSelect} isChecked={isSelected} />
            </Box>
        </TouchableOpacity>
    );
};
