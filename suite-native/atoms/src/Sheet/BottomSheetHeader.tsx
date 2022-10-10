import React from 'react';
import { TouchableOpacity, View } from 'react-native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon } from '@trezor/icons';

import { Text } from '../Text';

type BottomSheetHeaderProps = {
    title?: string;
    onCloseSheet: () => void;
};

const CLOSE_BUTTON_SIZE = 40;

const closeButtonStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.round,
    height: CLOSE_BUTTON_SIZE,
    width: CLOSE_BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
}));

const sheetHeaderStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: utils.spacings.medium,
    paddingVertical: utils.spacings.medium,
}));

// To center the title
const closeButtonPlaceholderStyle = prepareNativeStyle(() => ({
    width: CLOSE_BUTTON_SIZE,
}));

export const BottomSheetHeader = ({ title, onCloseSheet }: BottomSheetHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <View style={applyStyle(sheetHeaderStyle)}>
            <View style={applyStyle(closeButtonPlaceholderStyle)} />
            <Text variant="titleSmall">{title}</Text>
            <TouchableOpacity onPress={onCloseSheet} style={applyStyle(closeButtonStyle)}>
                <Icon name="close" />
            </TouchableOpacity>
        </View>
    );
};
