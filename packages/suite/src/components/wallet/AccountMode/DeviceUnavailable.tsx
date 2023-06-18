import React from 'react';
import { useDevice, useActions } from 'src/hooks/suite';
import * as deviceSettingsActions from 'src/actions/settings/deviceSettingsActions';
import { NotificationCard, Translation } from 'src/components/suite';

const DeviceUnavailable = () => {
    const { device, isLocked } = useDevice();
    const { applySettings } = useActions({
        applySettings: deviceSettingsActions.applySettings,
    });

    if (!device?.connected || device.available) return null;

    return (
        <NotificationCard
            variant="info"
            button={{
                children: <Translation id="TR_ACCOUNT_ENABLE_PASSPHRASE" />,
                isLoading: isLocked(),
                onClick: () => applySettings({ use_passphrase: true }),
            }}
        >
            <Translation id="TR_ACCOUNT_PASSPHRASE_DISABLED" />
        </NotificationCard>
    );
};

export default DeviceUnavailable;
