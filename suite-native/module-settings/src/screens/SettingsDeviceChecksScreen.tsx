import { Screen, ScreenHeader } from '@suite-native/navigation';
import { useTranslate } from '@suite-native/intl';

import { TurnOffFirmwareAuthenticityCheckCard } from '../components/TurnOffFirmwareAuthenticityCheckCard';

export const SettingsDeviceChecksScreen = () => {
    const { translate } = useTranslate();

    return (
        <Screen header={<ScreenHeader content={translate('moduleSettings.deviceChecks.title')} />}>
            <TurnOffFirmwareAuthenticityCheckCard />
        </Screen>
    );
};
