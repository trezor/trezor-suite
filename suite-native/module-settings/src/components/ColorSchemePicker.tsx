import { HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { ColorSchemePickerItem } from './ColorSchemePickerItem';
import { PreferencesSettingsCard } from './PreferencesSettingsCard';

const themesContainerStyle = prepareNativeStyle(_ => ({ flexWrap: 'wrap' }));

export const ColorSchemePicker = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <PreferencesSettingsCard
            iconName="palette"
            title={<Translation id="moduleSettings.preferences.theme.label" />}
        >
            <VStack spacing={11}>
                <HStack spacing="sp8" style={applyStyle(themesContainerStyle)}>
                    <ColorSchemePickerItem
                        colorScheme="standard"
                        translationId="moduleSettings.preferences.theme.standard"
                    />
                    <ColorSchemePickerItem
                        colorScheme="dark"
                        translationId="moduleSettings.preferences.theme.dark"
                    />
                    <ColorSchemePickerItem
                        colorScheme="system"
                        translationId="moduleSettings.preferences.theme.system"
                    />
                </HStack>
            </VStack>
        </PreferencesSettingsCard>
    );
};
