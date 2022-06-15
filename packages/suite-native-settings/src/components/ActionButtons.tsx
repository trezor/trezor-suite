import * as React from 'react';

import { Box, Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Icon, IconName } from '@trezor/icons';
import { TouchableOpacity } from 'react-native';

type ActionButtonProps = {
    iconName: IconName;
    title: string;
    onPress: () => void;
};

const rectangleButtonWrapperStyle = prepareNativeStyle(() => ({
    justifyContent: 'center',
    alignItems: 'center',
}));

const rectangleButtonStyle = prepareNativeStyle(utils => ({
    height: 79,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: utils.borders.radii.small,
    backgroundColor: utils.colors.gray300,
    margin: utils.spacings.small,
    flex: 1,
}));

const ActionButton = ({ iconName, title, onPress }: ActionButtonProps) => {
    const { applyStyle } = useNativeStyles();
    return (
        <TouchableOpacity style={applyStyle(rectangleButtonStyle)} onPress={onPress}>
            <Box justifyContent="center" alignItems="center">
                <Icon name={iconName} />
                <Text variant="label">{title.toUpperCase()}</Text>
            </Box>
        </TouchableOpacity>
    );
};

// TODO figure out a better name for this component
export const ActionButtons = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row" style={applyStyle(rectangleButtonWrapperStyle)}>
            <ActionButton
                // TODO replace icon
                iconName="standardWallet"
                title="eject device"
                onPress={() => console.log('eject')}
            />
            <ActionButton iconName="lock" title="lock app" onPress={() => console.log('lock')} />
        </Box>
    );
};
