import { useState } from 'react';

import { Text, NewModal, Column, Banner } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

type BluetoothDeniedForSuiteProps = {
    onCancel: () => void;
};

export const BluetoothDeniedForSuite = ({ onCancel }: BluetoothDeniedForSuiteProps) => {
    const [hasDeeplinkFailed, setHasDeeplinkFailed] = useState(false);

    const openSettings = async () => {
        const opened = await desktopApi.bluetoothOpenSettings();

        console.log('opened', opened);

        if (!opened.success || !opened.payload) {
            setHasDeeplinkFailed(true);
        }
    };

    return (
        <NewModal
            onCancel={onCancel}
            variant="info"
            iconName="bluetooth"
            bottomContent={
                <>
                    <NewModal.Button onClick={openSettings}>Enable bluetooth</NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        Cancel
                    </NewModal.Button>
                </>
            }
        >
            <Column alignItems="start" gap={spacings.xs}>
                <Text typographyStyle="titleSmall">Enable bluetooth on your computer</Text>
                <Text typographyStyle="body" variant="tertiary">
                    Or connect your Trezor via cable.
                </Text>
                {hasDeeplinkFailed && (
                    <Banner variant="warning">
                        Cannot open bluetooth settings. Please enable bluetooth manually.
                    </Banner>
                )}
            </Column>
        </NewModal>
    );
};
