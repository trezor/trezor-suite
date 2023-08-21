import React from 'react';
import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Text } from '../Text';
import { IconButton } from '../Button/IconButton';
import { Box } from '../Box';

type BottomSheetHeaderProps = {
    title?: string;
    subtitle?: string;
    onCloseSheet: () => void;
};

const sheetHeaderStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: utils.spacings.large,
    paddingTop: utils.spacings.extraLarge,
    paddingBottom: utils.spacings.medium,
}));

const titlesContainer = prepareNativeStyle(_ => ({
    maxWidth: '70%',
}));

const bottomSheetGrabberStyle = prepareNativeStyle(utils => ({
    width: 32,
    height: 4,
    borderRadius: utils.borders.radii.round,
    backgroundColor: utils.colors.borderDashed,
}));

const BottomSheetGrabber = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flex={1} alignItems="center">
            <Box style={applyStyle(bottomSheetGrabberStyle)} />
        </Box>
    );
};

export const BottomSheetHeader = ({ title, subtitle, onCloseSheet }: BottomSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box marginVertical="small">
            <BottomSheetGrabber />
            <View style={applyStyle(sheetHeaderStyle)}>
                <View style={applyStyle(titlesContainer)}>
                    <Text variant="titleSmall">{title}</Text>
                    {subtitle && (
                        <Text
                            variant="label"
                            color="textSubdued"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {subtitle}
                        </Text>
                    )}
                </View>
                <IconButton
                    iconName="close"
                    onPress={onCloseSheet}
                    colorScheme="tertiaryElevation0"
                    size="medium"
                />
            </View>
        </Box>
    );
};
