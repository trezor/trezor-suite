import { Screen, ScreenSubHeader, ScreenHeader } from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { DeviceManager } from '@suite-native/device-switcher';

import { ColorSchemePicker } from '../components/ColorSchemePicker';

export const SettingsCustomizationScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen
            screenHeader={
                <ScreenHeader>
                    <DeviceManager />
                </ScreenHeader>
            }
            subheader={
                <ScreenSubHeader content={translate('moduleSettings.customization.title')} />
            }
        >
            <Box marginHorizontal="medium">
                <ColorSchemePicker />
            </Box>
        </Screen>
    );
};
