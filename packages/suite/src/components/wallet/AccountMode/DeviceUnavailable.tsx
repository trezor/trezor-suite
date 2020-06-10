/* eslint-disable @typescript-eslint/camelcase */

import React from 'react';
import { Button, colors } from '@trezor/components';
import { useDevice, useActions } from '@suite-hooks';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import { NotificationCard, Translation } from '@suite-components';

const DeviceUnavailable = () => {
    const { isLocked } = useDevice();
    const { applySettings } = useActions({
        applySettings: deviceSettingsActions.applySettings,
    });
    return (
        <NotificationCard variant="info">
            <Translation id="TR_ACCOUNT_PASSPHRASE_DISABLED" />
            <Button
                variant="tertiary"
                icon="REFRESH"
                color={colors.BLUE_INFO}
                onClick={() => applySettings({ use_passphrase: true })}
                isLoading={isLocked()}
            >
                <Translation id="TR_ACCOUNT_ENABLE_PASSPHRASE" />
            </Button>
        </NotificationCard>
    );
};

export default DeviceUnavailable;
