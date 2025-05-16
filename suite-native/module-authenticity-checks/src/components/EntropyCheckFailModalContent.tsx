import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/core';

import { Translation } from '@suite-native/intl';
import { ScreenHeader } from '@suite-native/navigation';
import { HELP_CENTER_ENTROPY_CHECK_URL } from '@trezor/urls';

import { DeviceCompromisedModalContent } from './DeviceCompromisedModalContent';

const supportUrlWithChat = `${HELP_CENTER_ENTROPY_CHECK_URL}#open-chat`;

export const EntropyCheckFailModalContent = () => {
    const navigation = useNavigation();

    useEffect(() => {
        // Prevent navigation GO_BACK action; this modal will be shown as long as the device is connected
        const unsubscribe = navigation.addListener('beforeRemove', e => {
            if (e.data.action.type === 'GO_BACK') {
                e.preventDefault();
            }
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <DeviceCompromisedModalContent
            contactSupportUrl={supportUrlWithChat}
            screenHeaderContent={<ScreenHeader leftIcon={null} />}
            subtitleContent={
                <Translation id="moduleAuthenticityChecks.deviceCompromised.subtitle.entropy" />
            }
        />
    );
};
