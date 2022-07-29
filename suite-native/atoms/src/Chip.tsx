import React, { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Box } from './Box';
import { Text } from './Text';

export type ChipColorScheme = 'primary' | 'darkGray';

type ChipProps = {
    title: string;
    onSelect: () => void;
    description?: string;
    icon: ReactNode;
    isSelected?: boolean;
    style?: NativeStyleObject;
    colorScheme?: ChipColorScheme;
};

type ChipStyleProps = {
    isSelected: boolean;
    colorScheme: ChipColorScheme;
};
const chipStyle = prepareNativeStyle<ChipStyleProps>((utils, { isSelected, colorScheme }) => {
    const chipColorSchemeStyles: Record<ChipColorScheme, NativeStyleObject> = {
        darkGray: {
            backgroundColor: utils.colors.gray800,
        },
        primary: {
            backgroundColor: utils.colors.gray100,
            borderColor: utils.colors.gray400,
        },
    };

    const selectedChipColorSchemeStyles: Record<ChipColorScheme, NativeStyleObject> = {
        darkGray: {
            backgroundColor: utils.colors.white,
        },
        primary: {
            borderColor: utils.colors.forest,
            borderWidth: utils.borders.widths.medium,
        },
    };

    return {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
        height: 44,
        borderWidth: utils.borders.widths.small,
        borderRadius: utils.borders.radii.round,
        paddingHorizontal: 10,
        ...chipColorSchemeStyles[colorScheme],
        extend: {
            condition: isSelected,
            style: {
                ...selectedChipColorSchemeStyles[colorScheme],
            },
        },
    };
});

const chipTitleStyle = prepareNativeStyle<ChipStyleProps>((utils, { isSelected, colorScheme }) => {
    const chipTitleColorSchemeStyles: Record<ChipColorScheme, NativeStyleObject> = {
        darkGray: {
            color: utils.colors.white,
        },
        primary: {
            color: utils.colors.gray800,
        },
    };

    const selectedChipTitleColorSchemeStyles: Record<ChipColorScheme, NativeStyleObject> = {
        darkGray: {
            color: utils.colors.black,
        },
        primary: {
            color: utils.colors.forest,
        },
    };

    return {
        ...utils.typography.hint,
        ...chipTitleColorSchemeStyles[colorScheme],
        extend: {
            condition: isSelected,
            style: {
                ...utils.typography.callout,
                ...selectedChipTitleColorSchemeStyles[colorScheme],
            },
        },
    };
});

const chipDescriptionStyle = prepareNativeStyle(utils => ({
    ...utils.typography.label,
    lineHeight: 12, // Specific line height due to overlapping boxes in Figma design
}));

const textWrapperStyle = prepareNativeStyle(utils => ({
    justifyContent: 'center',
    marginLeft: utils.spacings.small,
}));

export const Chip = ({
    title,
    onSelect,
    description,
    icon,
    isSelected = false,
    style,
    colorScheme = 'primary',
}: ChipProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <TouchableOpacity
            onPress={onSelect}
            style={[applyStyle(chipStyle, { isSelected, colorScheme }), style]}
        >
            <Box>{icon}</Box>
            <Box style={applyStyle(textWrapperStyle)}>
                <Text style={applyStyle(chipTitleStyle, { isSelected, colorScheme })}>{title}</Text>
                {description && <Text style={applyStyle(chipDescriptionStyle)}>{description}</Text>}
            </Box>
        </TouchableOpacity>
    );
};
