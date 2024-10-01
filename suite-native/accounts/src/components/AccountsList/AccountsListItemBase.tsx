import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

import { Box, HStack, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type AccountListItemBaseProps = {
    icon: React.ReactNode;
    title: React.ReactNode;
    mainValue: React.ReactNode;
    secondaryValue: React.ReactNode;
    badges?: React.ReactNode;

    onPress?: TouchableOpacityProps['onPress'];
    disabled?: boolean;

    hasBackground?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    showDivider?: boolean;
};

const accountListItemStyle = prepareNativeStyle<{
    hasBackground: boolean;
    isFirst: boolean;
    isLast: boolean;
    showDivider: boolean;
}>((utils, { hasBackground, isFirst, isLast, showDivider }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItem: 'center',

    paddingVertical: 12,
    paddingHorizontal: utils.spacings.sp16,

    extend: {
        condition: hasBackground,
        style: {
            backgroundColor: utils.colors.backgroundSurfaceElevation1,
            paddingTop: utils.spacings.sp16,
            paddingBottom: utils.spacings.sp16,

            extend: [
                {
                    condition: isFirst,
                    style: {
                        borderTopLeftRadius: utils.borders.radii.medium,
                        borderTopRightRadius: utils.borders.radii.medium,
                        ...utils.boxShadows.small,
                    },
                },
                {
                    condition: isLast,
                    style: {
                        borderBottomLeftRadius: utils.borders.radii.medium,
                        borderBottomRightRadius: utils.borders.radii.medium,
                        marginBottom: utils.spacings.sp32,
                        ...utils.boxShadows.small,
                    },
                },
                {
                    condition: !isLast && showDivider,
                    style: {
                        borderBottomWidth: utils.borders.widths.small,
                        borderBottomColor: utils.colors.borderElevation1,
                    },
                },
            ],
        },
    },
}));

const accountDescriptionStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
}));

const valuesContainerStyle = prepareNativeStyle(utils => ({
    maxWidth: '40%',
    flexShrink: 0,
    alignItems: 'flex-end',
    paddingLeft: utils.spacings.sp8,
}));

export const AccountsListItemBase = ({
    icon,
    title,
    badges,
    mainValue,
    secondaryValue,
    onPress,
    disabled,
    hasBackground = false,
    isFirst = false,
    isLast = false,
    showDivider = false,
}: AccountListItemBaseProps) => {
    const { applyStyle } = useNativeStyles();

    const BaseComponent = onPress ? TouchableOpacity : Box;

    return (
        <BaseComponent
            style={applyStyle(accountListItemStyle, {
                hasBackground,
                isFirst,
                isLast,
                showDivider,
            })}
            onPress={onPress}
            disabled={disabled}
        >
            <Box flexDirection="row" alignItems="center" flex={1}>
                <Box marginRight="sp16">{icon}</Box>
                <Box style={applyStyle(accountDescriptionStyle)}>
                    <Text>{title}</Text>
                    <HStack spacing="sp4" alignItems="center">
                        {badges}
                    </HStack>
                </Box>
            </Box>
            <Box style={applyStyle(valuesContainerStyle)}>
                {mainValue}
                {secondaryValue}
            </Box>
        </BaseComponent>
    );
};
