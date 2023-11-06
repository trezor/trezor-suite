import { DeviceManagerScreenHeader } from '@suite-native/device-manager';
import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { Box } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';

import { ColorSchemePicker } from '../components/ColorSchemePicker';

export const SettingsCustomizationScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen
            screenHeader={<DeviceManagerScreenHeader />}
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
