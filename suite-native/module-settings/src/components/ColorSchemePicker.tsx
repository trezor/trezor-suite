import { HStack, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { ColorSchemePickerItem } from './ColorSchemePickerItem';
import { PreferencesSettingsCard } from './PreferencesSettingsCard';

const themesContainerStyle = prepareNativeStyle(_ => ({ flexWrap: 'wrap' }));

export const ColorSchemePicker = () => {
    const { applyStyle } = useNativeStyles();

    return (
        <PreferencesSettingsCard
            iconName="palette"
            title={<Translation id="moduleSettings.preferences.theme" />}
        >
            <VStack spacing={11}>
                <HStack spacing="sp8" style={applyStyle(themesContainerStyle)}>
                    <ColorSchemePickerItem colorScheme="standard" />
                    <ColorSchemePickerItem colorScheme="dark" />
                    <ColorSchemePickerItem colorScheme="system" />
                </HStack>
            </VStack>
        </PreferencesSettingsCard>
    );
};
