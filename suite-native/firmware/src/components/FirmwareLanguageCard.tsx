import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Locale } from '@suite-common/suite-types';
import {
    selectDeviceLanguage,
    selectIsDeviceLanguageConfigurable,
    selectSupportedDeviceLanguages,
} from '@suite-common/wallet-core';
import { Card, HStack, Select, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackToStackCompositeNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceFirmware,
    RootStackParamList
>;

export const FirmwareLanguageCard = () => {
    const navigation = useNavigation<NavigationProps>();

    const isDeviceLanguageConfigurable = useSelector(selectIsDeviceLanguageConfigurable);
    const supportedDeviceLanguages = useSelector(selectSupportedDeviceLanguages);
    const deviceLanguage = useSelector(selectDeviceLanguage);

    const changeFirmwareLanguageIfDifferent = (language: Locale) => {
        if (language !== deviceLanguage) {
            navigation.navigate(DeviceSettingsStackRoutes.FirmwareLanguage, { language });
        }
    };

    if (!isDeviceLanguageConfigurable || !deviceLanguage) {
        return null;
    }

    return (
        <Card>
            <VStack spacing="sp16">
                <HStack>
                    <Icon name="translate" size="mediumLarge" />
                    <Text variant="body">
                        <Translation id="firmware.languageCard.title" />
                    </Text>
                </HStack>
                <Select
                    items={supportedDeviceLanguages}
                    selectValue={deviceLanguage}
                    selectLabel={<Translation id="firmware.languageCard.title" />}
                    onSelectItem={changeFirmwareLanguageIfDifferent}
                />
            </VStack>
        </Card>
    );
};
