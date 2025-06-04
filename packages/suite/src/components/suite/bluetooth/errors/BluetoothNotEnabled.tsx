import { useState } from 'react';

import { Banner, Button, Column, Text } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

import { BluetoothErrorDialog } from './BluetoothErrorDialog';
import { Translation } from '../../Translation';

type BluetoothNotEnabledProps = {
    onCancel: () => void;
    uiMode: 'spatial' | 'card';
};

export const BluetoothNotEnabled = ({ onCancel, uiMode }: BluetoothNotEnabledProps) => {
    const [hasDeeplinkFailed, setHasDeeplinkFailed] = useState(false);

    const openSettings = async () => {
        const opened = await desktopApi.openSystemSettings('bluetooth');

        if (!opened.success) {
            setHasDeeplinkFailed(true);
        }
    };

    return (
        <BluetoothErrorDialog
            uiMode={uiMode}
            header={<Translation id="TR_BLUETOOTH_TURNED_OFF" />}
            buttons={
                <>
                    <Button onClick={openSettings}>
                        <Translation id="TR_BLUETOOTH_SETTINGS" />
                    </Button>
                    <Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CLOSE" />
                    </Button>
                </>
            }
        >
            <Column alignItems="start" gap={spacings.xxs}>
                <Text typographyStyle="titleSmall">
                    <Translation id="TR_BLUETOOTH_TURN_ON_BLUETOOTH" />
                </Text>
                <Text typographyStyle="body" variant="tertiary">
                    <Translation id="TR_BLUETOOTH_TURNED_OFF_TEXT" />
                </Text>
            </Column>
            {hasDeeplinkFailed && (
                <Banner variant="warning">
                    <Translation id="TR_BLUETOOTH_CANNOT_OPEN_BLUETOOTH_SETTINGS" />
                </Banner>
            )}
        </BluetoothErrorDialog>
    );
};
