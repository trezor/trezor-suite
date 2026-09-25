import { forgetAllBluetoothDevicesThunk, openSystemSettingsThunk } from '@suite/bluetooth';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

export const ForgetAllDevicesButton = () => {
    const { dispatch } = useServices(injectDispatch);

    const handleForgetButtonClick = () => {
        dispatch(forgetAllBluetoothDevicesThunk());
        dispatch(notificationsActions.addToast({ type: 'clear-storage' }));
    };
    const handleOpenSettingsButtonClick = () => {
        dispatch(openSystemSettingsThunk({ type: 'bluetooth' }));
    };

    return (
        <SectionItem>
            <TextColumn
                title="Forget all known Bluetooth devices"
                description="Forgets devices persisted in Suite. In order to fully remove, go to system settings and manually remove the device there."
            />
            <ActionColumn>
                <ActionButton onClick={handleForgetButtonClick} size="small" intent="critical">
                    Forget in Suite
                </ActionButton>
                <ActionButton
                    onClick={handleOpenSettingsButtonClick}
                    size="small"
                    intent="neutral"
                    priority="secondary"
                >
                    Open system settings
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
