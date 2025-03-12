import { useState } from 'react';

import { Banner, Button, Card, Column, Icon, Row, Text } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

export const BluetoothNotEnabled = () => {
    const [hasDeeplinkFailed, setHasDeeplinkFailed] = useState(false);

    const openSettings = async () => {
        const opened = await desktopApi.openSystemSettings('bluetooth');

        if (!opened.success) {
            setHasDeeplinkFailed(true);
        }
    };

    return (
        <Card>
            <Column alignItems="start" gap={spacings.xs}>
                <Icon name="bluetooth" />
                <Text typographyStyle="titleSmall">Enable bluetooth on your computer</Text>
                <Text typographyStyle="body" variant="tertiary">
                    Or connect your Trezor via cable.
                </Text>
                {hasDeeplinkFailed && (
                    <Banner variant="warning">
                        Cannot open bluetooth settings. Please enable bluetooth manually.
                    </Banner>
                )}
                <Row>
                    <Button onClick={openSettings}>Open settings and enable bluetooth</Button>
                </Row>
            </Column>
        </Card>
    );
};
