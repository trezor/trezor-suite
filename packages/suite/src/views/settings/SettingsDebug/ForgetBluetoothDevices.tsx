import { bluetoothActions } from '@suite-common/bluetooth';
import { notificationsActions } from '@suite-common/toast-notifications';
import { desktopApi } from '@trezor/suite-desktop-api';

import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const ForgetAllDevicesButton = () => {
    const dispatch = useDispatch();

    const handleForgetButtonClick = () => {
        dispatch(bluetoothActions.knownDevicesUpdateAction({ knownDevices: [] }));
        dispatch(notificationsActions.addToast({ type: 'clear-storage' }));
    };
    const handleOpenSettingsButtonClick = () => desktopApi.openSystemSettings('bluetooth');

    return (
        <SectionItem>
            <TextColumn
                title="Forget all known Bluetooth devices"
                description="Forgets devices persisted in Suite. In order to fully remove, go to system settings and manually remove the device there."
            />
            <ActionColumn>
                <ActionButton onClick={handleForgetButtonClick} size="small" variant="destructive">
                    Forget in Suite
                </ActionButton>
                <ActionButton
                    onClick={handleOpenSettingsButtonClick}
                    size="small"
                    variant="tertiary"
                >
                    Open system settings
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
