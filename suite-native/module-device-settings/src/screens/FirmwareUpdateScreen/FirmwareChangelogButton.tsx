import { TouchableOpacity } from 'react-native';
import { useState } from 'react';

import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { FirmwareChangelog } from './FirmwareChangelog';

const linkTextStyle = prepareNativeStyle(utils => ({
    color: utils.colors.textSubdued,
    textDecorationLine: 'underline',
}));

const linkContainerStyle = prepareNativeStyle(_utils => ({
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 2,
}));

export const FirmwareChangelogButton = () => {
    const { applyStyle } = useNativeStyles();
    const [isVisible, setIsVisible] = useState(false);

    const handlePress = () => {
        setIsVisible(true);
    };

    const handleClose = () => {
        setIsVisible(false);
    };

    return (
        <>
            <TouchableOpacity style={applyStyle(linkContainerStyle)} onPress={handlePress}>
                <Icon name="question" size="medium" color="iconSubdued" />
                <Text variant="body" color="textSubdued" style={applyStyle(linkTextStyle)}>
                    <Translation id="moduleDeviceSettings.firmware.firmwareUpdateScreen.changelog.button" />
                </Text>
            </TouchableOpacity>
            <FirmwareChangelog isVisible={isVisible} onClose={handleClose} />
        </>
    );
};
