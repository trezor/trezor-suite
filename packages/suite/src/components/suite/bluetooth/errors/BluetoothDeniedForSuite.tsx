import { useState } from 'react';

import { Banner, Button, Text } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { BluetoothErrorDialog } from './BluetoothErrorDialog';
import { Translation } from '../../Translation';
import { BluetoothConnectUiMode } from '../bluetoothTypes';

type BluetoothDeniedForSuiteProps = {
    onCancel: () => void;
    uiMode: BluetoothConnectUiMode;
};

export const BluetoothDeniedForSuite = ({ onCancel, uiMode }: BluetoothDeniedForSuiteProps) => {
    const [hasDeeplinkFailed, setHasDeeplinkFailed] = useState(false);

    const openSettings = async () => {
        const opened = await desktopApi.openSystemSettings('bluetooth-security');
        if (!opened.success) {
            setHasDeeplinkFailed(true);
        }
    };

    return (
        <BluetoothErrorDialog
            uiMode={uiMode}
            header="Permission denied"
            buttons={
                <>
                    <Button onClick={openSettings}>
                        <Translation id="TR_BLUETOOTH_OPEN_PERMISSIONS_SETTINGS" />
                    </Button>
                    <Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CLOSE" />
                    </Button>
                </>
            }
        >
            <Text typographyStyle="titleSmall">
                <Translation id="TR_BLUETOOTH_ALLOW_BLUETOOTH_PERMISSIONS" />
            </Text>
            <Text typographyStyle="body" variant="tertiary">
                <Translation id="TR_BLUETOOTH_OR_CONNECT_VIA_CABLE" />
            </Text>

            {hasDeeplinkFailed && (
                <Banner variant="warning">
                    <Translation id="TR_BLUETOOTH_CANNOT_OPEN_BLUETOOTH_SETTINGS_PERMISSIONS" />
                </Banner>
            )}
        </BluetoothErrorDialog>
    );
};
