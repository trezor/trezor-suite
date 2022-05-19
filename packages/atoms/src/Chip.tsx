import React, { ReactNode } from 'react';
import { Text } from './Text';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TouchableOpacity } from 'react-native';
import { Box } from './Box';

type ChipProps = {
    title: string;
    onSelect: () => void;
    hint?: ReactNode;
    icon: ReactNode;
} & ChipStyleProps;

const CHIP_HEIGHT = 44;
type ChipStyleProps = {
    isSelected?: boolean;
};
const chipStyles = prepareNativeStyle<ChipStyleProps>((utils, { isSelected }) => ({
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: utils.borders.widths.sm,
    borderRadius: CHIP_HEIGHT / 2,
    width: 95,
    height: CHIP_HEIGHT,
    backgroundColor: utils.colors.gray100,
    borderColor: isSelected ? utils.colors.forest : utils.colors.gray400,
}));

const chipTextStyles = prepareNativeStyle<ChipStyleProps>((utils, { isSelected }) => ({
    ...utils.typography.callout,
    color: isSelected ? utils.colors.forest : utils.colors.gray800,
    extend: {
        condition: isSelected ?? false,
        style: {
            fontWeight: utils.fontWeights.semiBold,
        },
    },
}));

export const Chip = ({ title, onSelect, hint, icon, isSelected = false }: ChipProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity onPress={onSelect} style={applyStyle(chipStyles, { isSelected })}>
            {icon}
            <Box marginLeft="sm">
                <Text style={applyStyle(chipTextStyles, { isSelected })}>{title}</Text>
                {hint && hint}
            </Box>
        </TouchableOpacity>
    );
};
