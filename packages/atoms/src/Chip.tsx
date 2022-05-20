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
    borderWidth: utils.borders.widths.sm,
    borderRadius: CHIP_HEIGHT / 2,
    height: CHIP_HEIGHT,
    backgroundColor: utils.colors.gray100,
    borderColor: utils.colors.gray400,
    extend: {
        condition: !!isSelected,
        style: {
            borderColor: utils.colors.forest,
            borderWidth: utils.borders.widths.md,
        },
    },
}));

const chipTextStyles = prepareNativeStyle<ChipStyleProps>((utils, { isSelected }) => ({
    ...utils.typography.callout,
    color: utils.colors.gray800,
    fontWeight: utils.fontWeights.normal,
    marginBottom: utils.spacings.sm / 4,
    extend: {
        condition: !!isSelected,
        style: {
            color: utils.colors.forest,
            fontWeight: utils.fontWeights.semiBold,
        },
    },
}));

const textWrapperStyle = prepareNativeStyle(utils => ({
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    marginLeft: utils.spacings.sm,
    marginRight: 10,
    height: 30, // TODO Improve!!! For now this is only solution I found to squish those 2 text elements together
}));

const textStyle = prepareNativeStyle(utils => ({
    ...utils.typography.label,
    fontWeight: utils.fontWeights.normal,
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
                <Text style={applyStyle(chipTextStyles, { isSelected })}>{title}</Text>
                {description && <Text style={applyStyle(textStyle)}>{description}</Text>}
            </Box>
        </TouchableOpacity>
    );
};
