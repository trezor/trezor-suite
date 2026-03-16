import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectDeviceLanguage,
    selectIsDeviceLanguageConfigurable,
    selectSupportedDeviceLanguages,
} from '@suite-common/device';
import { type Locale } from '@suite-common/suite-types';
import { Badge, Card, HStack, Select, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes.DeviceFirmware
>;

const BetaBadge = () => (
    <Badge label={<Translation id="firmware.languageCard.betaBadge" />} variant="blue" />
);

export const FirmwareLanguageCard = () => {
    const navigation = useNavigation<NavigationProps>();

    const isDeviceLanguageConfigurable = useSelector(selectIsDeviceLanguageConfigurable);
    const supportedDeviceLanguages = useSelector(selectSupportedDeviceLanguages);
    const deviceLanguage = useSelector(selectDeviceLanguage);

    const deviceLanguageItems = useMemo(
        () =>
            supportedDeviceLanguages.map(({ value, icon, label, isBeta }) => ({
                value,
                label,
                icon: <Text>{icon}</Text>,
                badge: isBeta && <BetaBadge />,
            })),
        [supportedDeviceLanguages],
    );

    const changeFirmwareLanguageIfDifferent = (language: Locale) => {
        if (language !== deviceLanguage) {
            navigation.navigate(DeviceSettingsStackRoutes.FirmwareLanguageStack, { language });
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
                    <Text variant="body-md">
                        <Translation id="firmware.languageCard.title" />
                    </Text>
                </HStack>
                <Select<Locale>
                    title={<Translation id="firmware.languageCard.title" />}
                    items={deviceLanguageItems}
                    value={deviceLanguage}
                    onSelectItem={changeFirmwareLanguageIfDifferent}
                    isConfirmable
                />
            </VStack>
        </Card>
    );
};
