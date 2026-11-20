import { TouchableSwitchRow } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useDeviceAutoConnect } from '../hooks/useDeviceAutoConnect';

export const AutoConnectCard = () => {
    const { isAutoConnectEnabled, toggleAutoConnect } = useDeviceAutoConnect();

    return (
        <TouchableSwitchRow
            icon="trezorSafe5"
            accessibilityLabel="auto-connect"
            text={<Translation id="moduleDeviceSettings.autoConnect.title" />}
            description={<Translation id="moduleDeviceSettings.autoConnect.description" />}
            isChecked={isAutoConnectEnabled}
            onChange={toggleAutoConnect}
        />
    );
};
