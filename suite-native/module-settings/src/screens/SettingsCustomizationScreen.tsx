import { Card } from '@suite-native/atoms';
import { Screen, ScreenHeader } from '@suite-native/navigation';
import { useTranslate } from '@suite-native/intl';

import { ColorSchemePicker } from '../components/ColorSchemePicker';

export const SettingsCustomizationScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen header={<ScreenHeader content={translate('moduleSettings.customization.title')} />}>
            <Card>
                <ColorSchemePicker />
            </Card>
        </Screen>
    );
};
