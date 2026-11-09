import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceProtectedByPassphrase } from '@suite-common/device';
import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type DeviceSettingsStackParamList,
    DeviceSettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<DeviceSettingsStackParamList, DeviceSettingsStackRoutes>;

export const PassphraseCard = () => {
    const navigation = useNavigation<NavigationProp>();

    const isPassphraseEnabled = useSelector(selectIsDeviceProtectedByPassphrase);

    const navigateToDevicePassphraseStack = () => {
        navigation.navigate(DeviceSettingsStackRoutes.DevicePassphraseStack);
    };

    return (
        <TouchableSwitchRow
            isChecked={isPassphraseEnabled}
            onChange={navigateToDevicePassphraseStack}
            icon="password"
            accessibilityLabel="passphrase"
            text={<Translation id="moduleDeviceSettings.passphrase.title" />}
            description={<Translation id="moduleDeviceSettings.passphrase.description" />}
            testID="@device-passphrase/passphrase"
        />
    );
};
