import { Screen, ScreenSubHeader } from '@suite-native/navigation';
import { Text } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

export const SettingsViewOnly = () => {
    const { translate } = useTranslate();

    return (
        <Screen
            screenHeader={<ScreenSubHeader content={translate('moduleSettings.viewOnly.title')} />}
        >
            <Text>
                <Translation id="moduleSettings.viewOnly.subtitle" />
            </Text>
        </Screen>
    );
};
