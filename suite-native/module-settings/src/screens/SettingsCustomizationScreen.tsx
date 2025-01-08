import { Card } from '@suite-native/atoms';
import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { useTranslate } from '@suite-native/intl';

import { ColorSchemePicker } from '../components/ColorSchemePicker';

export const SettingsCustomizationScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader content={translate('moduleSettings.customization.title')} />
            }
        >
            <Card>
                <ColorSchemePicker />
            </Card>
        </Screen>
    );
};
