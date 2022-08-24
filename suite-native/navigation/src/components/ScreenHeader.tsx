import React from 'react';
import { TouchableOpacity } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box, Text } from '@suite-native/atoms';
import { Icon } from '@trezor/icons';

type ScreenHeaderProps = {
    title?: string;
};

const GO_BACK_BUTTON_SIZE = 40;
const iconStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray300,
    height: GO_BACK_BUTTON_SIZE,
    width: GO_BACK_BUTTON_SIZE,
    borderRadius: utils.borders.radii.round,
    justifyContent: 'center',
    alignItems: 'center',
}));

const headerStyle = prepareNativeStyle(_ => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingTop: 15,
}));

export const ScreenHeader = ({ title }: ScreenHeaderProps) => {
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation();

    return (
        <Box style={applyStyle(headerStyle)}>
            {/* TODO based on design it might be without BG color,
             but design is not ready yet so there might be some inconsistencies */}
            <TouchableOpacity style={applyStyle(iconStyle)} onPress={() => navigation.goBack()}>
                <Icon name="chevronLeft" size="large" color="gray800" />
            </TouchableOpacity>
            {title && <Text variant="titleSmall">{title}</Text>}
            {/* Empty box for centered header text */}
            <Box style={{ width: GO_BACK_BUTTON_SIZE }} />
        </Box>
    );
};
