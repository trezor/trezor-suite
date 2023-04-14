import React from 'react';
import { View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { Text } from '../Text';
import { IconButton } from '../Button/IconButton';
import { Divider } from '../Divider';
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
    paddingVertical: utils.spacings.extraLarge,
}));

const titlesContainer = prepareNativeStyle(_ => ({
    maxWidth: '70%',
}));

export const BottomSheetHeader = ({ title, subtitle, onCloseSheet }: BottomSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <Box marginBottom="small">
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
            <Divider />
        </Box>
    );
};
