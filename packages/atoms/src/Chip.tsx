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
    isSelected?: boolean;
};

type ChipStyleProps = {
    isSelected: boolean;
};
const chipStyle = prepareNativeStyle<ChipStyleProps>((utils, { isSelected }) => ({
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 44,
    backgroundColor: utils.colors.gray100,
    borderWidth: utils.borders.widths.sm,
    borderRadius: utils.borders.radii.round,
    borderColor: utils.colors.gray400,
    paddingHorizontal: 10,
    extend: {
        condition: isSelected,
        style: {
            borderColor: utils.colors.forest,
            borderWidth: utils.borders.widths.md,
        },
    },
}));

const chipTitleStyle = prepareNativeStyle<ChipStyleProps>((utils, { isSelected }) => ({
    ...utils.typography.hint,
    color: utils.colors.gray800,
    extend: {
        condition: isSelected,
        style: {
            ...utils.typography.callout,
            color: utils.colors.forest,
        },
    },
}));

const chipDescriptionStyle = prepareNativeStyle(utils => ({
    ...utils.typography.label,
    lineHeight: 12, // Specific line height due to overlapping boxes in Figma design
}));

const textWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    marginLeft: utils.spacings.sm,
}));

export const Chip = ({ title, onSelect, description, icon, isSelected = false }: ChipProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity onPress={onSelect} style={applyStyle(chipStyle, { isSelected })}>
            <Box>{icon}</Box>
            <Box style={applyStyle(textWrapperStyle)}>
                <Text style={applyStyle(chipTitleStyle, { isSelected })}>{title}</Text>
                {description && <Text style={applyStyle(chipDescriptionStyle)}>{description}</Text>}
            </Box>
        </TouchableOpacity>
    );
};
