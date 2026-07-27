import { useServices } from '@suite-common/dependency-injection';
import { persistentDeviceDataActions } from '@suite-common/persistent-device-data';
import { selectDispatch } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

export const ClearDevicePersistentData = () => {
    const { dispatch } = useServices(selectDispatch);

    const handleClick = () => {
        dispatch(persistentDeviceDataActions.clearDevicePersistentData());
        // technically just part of the storage was cleared, but it's just dev util, so close enough to let you know it is finished
        dispatch(notificationsActions.addToast({ type: 'clear-storage' }));
    };

    return (
        <SectionItem>
            <TextColumn
                title="Clear app's device persistent data"
                description="Clears Suite's stored per-device persistent data (mostly security checks). Does not affect Bluetooth or THP."
            />
            <ActionColumn>
                <ActionButton onClick={handleClick} size="small" intent="critical">
                    Clear
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
