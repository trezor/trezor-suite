import { useEffect } from 'react';

import { useNavigation } from '@react-navigation/native';

import { CenteredTitleHeader, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Screen, ScreenHeader, useInterceptNativeNavigation } from '@suite-native/navigation';
import { useToast } from '@suite-native/toasts';

import { DisconnectTrezorSvg } from '../components/DisconnectTrezorSvg';

export const ForgetDeviceFinishScreen = () => {
    const navigation = useNavigation();
    const { showToast } = useToast();

    useInterceptNativeNavigation();

    useEffect(
        () =>
            navigation.addListener('beforeRemove', () => {
                showToast({
                    icon: 'check',
                    intent: 'neutral',
                    message: <Translation id="moduleDeviceSettings.forgetDevice.successToast" />,
                });
            }),
        [navigation, showToast],
    );

    return (
        <Screen header={<ScreenHeader leftIcon={null} />} isScrollable={false}>
            <VStack marginTop="sp16" spacing="sp32" alignItems="center">
                <CenteredTitleHeader
                    title={<Translation id="moduleDeviceSettings.forgetDevice.finish.title" />}
                    titleVariant="headline-md"
                    subtitle={
                        <Translation id="moduleDeviceSettings.forgetDevice.finish.subtitle" />
                    }
                />
                <DisconnectTrezorSvg />
            </VStack>
        </Screen>
    );
};
