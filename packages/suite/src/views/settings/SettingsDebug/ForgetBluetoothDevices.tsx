import { injectBluetooth, openSystemSettingsThunk } from '@suite/bluetooth';
import { injectDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';

export const ForgetAllDevicesButton = () => {
    const { dispatch, bluetooth } = useServices(injectDispatch, injectBluetooth);

    const handleForgetButtonClick = () => {
        bluetooth.forgetAllDevices();
        dispatch(notificationsActions.addToast({ type: 'clear-storage' }));
    };
    const handleOpenSettingsButtonClick = () => {
        dispatch(openSystemSettingsThunk({ type: 'bluetooth' }));
    };

    return (
        <SectionItem
            title="Forget all known Bluetooth devices"
            description="Forgets devices persisted in Suite. In order to fully remove, go to system settings and manually remove the device there."
            actions={
                <>
                    <SectionItem.Button
                        onClick={handleForgetButtonClick}
                        size="small"
                        intent="critical"
                    >
                        Forget in Suite
                    </SectionItem.Button>
                    <SectionItem.Button
                        onClick={handleOpenSettingsButtonClick}
                        size="small"
                        intent="neutral"
                        priority="secondary"
                    >
                        Open system settings
                    </SectionItem.Button>
                </>
            }
        />
    );
};
