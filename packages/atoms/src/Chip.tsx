import React, { ReactNode } from 'react';
import { Text } from './Text';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { TouchableOpacity } from 'react-native';
import { Box } from './Box';

type ChipProps = {
    title: string;
    onSelect: () => void;
    description?: string;
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
    alignSelf: 'flex-start',
    height: CHIP_HEIGHT,
    backgroundColor: utils.colors.gray100,
    borderWidth: utils.borders.widths.sm,
    borderRadius: CHIP_HEIGHT / 2,
    borderColor: utils.colors.gray400,
    extend: {
        condition: !!isSelected,
        style: {
            borderColor: utils.colors.forest,
            borderWidth: utils.borders.widths.md,
        },
    },
}));

const chipTitleStyle = prepareNativeStyle<ChipStyleProps>((utils, { isSelected }) => ({
    ...utils.typography.callout,
    fontWeight: isSelected ? utils.fontWeights.semiBold : utils.fontWeights.normal,
    color: utils.colors.gray800,
    extend: {
        condition: !!isSelected,
        style: {
            color: utils.colors.forest,
            fontWeight: utils.fontWeights.semiBold,
        },
    },
}));

const chipDescriptionStyle = prepareNativeStyle(utils => ({
    ...utils.typography.label,
    // This is the only way to get texts closer together because in design the boxes with line height are overlapping
    lineHeight: 12,
    fontWeight: utils.fontWeights.normal,
    display: 'flex',
    alignSelf: 'flex-start',
}));

const textWrapperStyle = prepareNativeStyle(utils => ({
    marginLeft: utils.spacings.sm,
    marginRight: 10,
}));

const iconStyle = prepareNativeStyle(() => ({
    marginLeft: 10,
}));

export const Chip = ({ title, onSelect, description, icon, isSelected = false }: ChipProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity onPress={onSelect} style={applyStyle(chipStyles, { isSelected })}>
            <Box style={applyStyle(iconStyle)}>{icon}</Box>
            <Box style={applyStyle(textWrapperStyle)}>
                <Text style={applyStyle(chipTitleStyle, { isSelected })}>{title}</Text>
                {description && <Text style={applyStyle(chipDescriptionStyle)}>{description}</Text>}
            </Box>
        </TouchableOpacity>
    );
};
