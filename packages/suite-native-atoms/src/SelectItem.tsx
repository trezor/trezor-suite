import React from 'react';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from './Box';
import { Icon } from './Icon/Icon';
import { Radio } from './Radio';
import { Text } from './Text';
import { TouchableOpacity } from 'react-native';

export type SelectItemProps = {
    label: string;
    value: string | number;
    onSelect: () => void;
    isSelected: boolean;
    isLastChild?: boolean;
};

type SelectItemStyleProps = {
    isLastChild: boolean;
};
const selectItemStyle = prepareNativeStyle<SelectItemStyleProps>((utils, { isLastChild }) => ({
    borderBottomWidth: utils.borders.widths.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    extend: {
        condition: isLastChild,
        style: {
            borderBottomWidth: 0,
        },
    },
}));

export const SelectItem = ({
    label,
    value,
    onSelect,
    isSelected,
    isLastChild = false,
}: SelectItemProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <TouchableOpacity style={applyStyle(selectItemStyle, { isLastChild })} onPress={onSelect}>
            <Box flexDirection="row">
                <Icon type="closeCircle" />
                <Text>{label}</Text>
            </Box>
            <Radio value={String(value)} onPress={onSelect} isChecked={isSelected} />
        </TouchableOpacity>
    );
};
