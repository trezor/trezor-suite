import { useState } from 'react';

import { Banner, H3, Modal, Paragraph } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite';

import { setBluetoothDeviceNeedsManualOsRemoval } from '../../../actions/bluetooth/desktopBluetoothReducer';
import { selectUnpairedDeviceNeedsManualOsRemoval } from '../../../actions/bluetooth/desktopBluetoothSelectors';
import { useDispatch, useSelector } from '../../../hooks/suite';

export const UnpairedBluetoothDeviceNeedsManualOsRemovalModal = () => {
    const dispatch = useDispatch();
    const wasBluetoothDeviceWiped = useSelector(selectUnpairedDeviceNeedsManualOsRemoval);

    const [hasDeeplinkFailed, setHasDeeplinkFailed] = useState(false);

    const handleOpenBluetoothSettings = async () => {
        const opened = await desktopApi.openSystemSettings('bluetooth');

        if (!opened.success) {
            setHasDeeplinkFailed(true);
        }
    };

    const onCancel = () => {
        dispatch(setBluetoothDeviceNeedsManualOsRemoval({ needsManualRemoval: false }));
    };

    if (!wasBluetoothDeviceWiped) {
        return null;
    }

    return (
        <Modal
            onCancel={onCancel}
            variant="info"
            iconName="info"
            bottomContent={
                <>
                    <Modal.Button
                        onClick={handleOpenBluetoothSettings}
                        data-testid="@wipe/open-bluetooth-settings"
                    >
                        <Translation id="TR_BLUETOOTH_OPEN_BLUETOOTH_SETTINGS" />
                    </Modal.Button>
                    <Modal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <H3>
                <Translation id="TR_BLUETOOTH_REMOVE_FROM_BLUETOOTH_SETTINGS" />
            </H3>
            <Paragraph variant="tertiary" margin={{ top: spacings.xs }}>
                <Translation id="TR_BLUETOOTH_REMOVE_FROM_BLUETOOTH_SETTINGS_DESCRIPTION" />
            </Paragraph>
            {hasDeeplinkFailed && (
                <Banner variant="warning">
                    <Translation id="TR_BLUETOOTH_CANNOT_OPEN_BLUETOOTH_SETTINGS" />
                </Banner>
            )}
        </Modal>
    );
};
