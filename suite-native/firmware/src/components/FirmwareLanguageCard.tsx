import { useSelector } from 'react-redux';

import { Locale } from '@suite-common/suite-types';
import {
    selectDeviceLanguage,
    selectIsDeviceLanguageConfigurable,
    selectSupportedDeviceLanguages,
} from '@suite-common/wallet-core';
import { Card, HStack, Select, Text, VStack } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { useFirmwareLanguage } from '../hooks/useFirmwareLanguage';

export const FirmwareLanguageCard = () => {
    const { changeFirmwareLanguage } = useFirmwareLanguage();

    const isDeviceLanguageConfigurable = useSelector(selectIsDeviceLanguageConfigurable);
    const supportedDeviceLanguages = useSelector(selectSupportedDeviceLanguages);
    const deviceLanguage = useSelector(selectDeviceLanguage);

    const changeFirmwareLanguageIfDifferent = (language: Locale) => {
        if (language !== deviceLanguage) {
            changeFirmwareLanguage(language);
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
                    value={deviceLanguage}
                    title={<Translation id="firmware.languageCard.title" />}
                    onSelectItem={changeFirmwareLanguageIfDifferent}
                    isConfirmable
                />
            </VStack>
        </Card>
    );
};
