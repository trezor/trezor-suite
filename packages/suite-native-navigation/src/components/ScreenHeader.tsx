import React from 'react';
import { useNavigation } from '@react-navigation/native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';
import { TouchableOpacity } from 'react-native';
import { Icon } from '@trezor/icons';
import { ScreenProp } from '@suite-native/navigation';

const iconStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray300,
    height: 40,
    width: 40,
    borderRadius: utils.borders.radii.round,
    justifyContent: 'center',
    alignItems: 'center',
}));
const headerStyle = prepareNativeStyle(utils => ({
    paddingHorizontal: utils.spacings.medium,
    paddingBottom: 10,
    paddingTop: 15,
}));

export const ScreenHeader = () => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<ScreenProp>();

    return (
        <Box style={applyStyle(headerStyle)}>
            <TouchableOpacity style={applyStyle(iconStyle)} onPress={() => navigation.goBack()}>
                <Icon name="chevronLeft" size="large" color="gray800" />
            </TouchableOpacity>
        </Box>
    );
};
