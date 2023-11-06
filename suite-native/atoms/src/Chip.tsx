import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { Box } from './Box';
import { Text } from './Text';

type ChipProps = {
    title: string;
    onSelect: () => void;
    description?: string;
    icon: ReactNode;
    isSelected?: boolean;
    style?: NativeStyleObject;
    titleColor?: Color;
};

type ChipStyleProps = {
    isSelected: boolean;
    titleColor: Color;
};
const chipStyle = prepareNativeStyle<ChipStyleProps>((utils, { isSelected }) => ({
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
    height: 44,
    backgroundColor: utils.colors.backgroundSurfaceElevation0,
    borderWidth: utils.borders.widths.s,
    borderRadius: utils.borders.radii.round,
    borderColor: utils.colors.borderFocus,
    paddingHorizontal: 10,
    extend: {
        condition: isSelected,
        style: {
            borderColor: utils.colors.borderSecondary,
            borderWidth: utils.borders.widths.medium,
        },
    },
}));

const chipTitleStyle = prepareNativeStyle<ChipStyleProps>((utils, { isSelected, titleColor }) => ({
    ...utils.typography.hint,
    color: utils.colors[titleColor],
    extend: {
        condition: isSelected,
        style: {
            ...utils.typography.callout,
            color: utils.colors.textOnSecondary,
        },
    },
}));

const chipDescriptionStyle = prepareNativeStyle(utils => ({
    ...utils.typography.label,
    lineHeight: 12, // Specific line height due to overlapping boxes in Figma design
}));

const textWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    marginLeft: utils.spacings.s,
}));

export const Chip = ({
    title,
    onSelect,
    description,
    icon,
    titleColor = 'textDisabled',
    isSelected = false,
    style,
}: ChipProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity
            onPress={onSelect}
            style={[applyStyle(chipStyle, { isSelected, titleColor }), style]}
        >
            <Box>{icon}</Box>
            <Box style={applyStyle(textWrapperStyle)}>
                <Text style={applyStyle(chipTitleStyle, { isSelected, titleColor })}>{title}</Text>
                {description && <Text style={applyStyle(chipDescriptionStyle)}>{description}</Text>}
            </Box>
        </TouchableOpacity>
    );
};
