import { deviceActions } from '@suite-common/device';
import { notificationsActions } from '@suite-common/toast-notifications';

import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const ClearDevicePersistentData = () => {
    const dispatch = useDispatch();

    const handleClick = () => {
        dispatch(deviceActions.clearDevicePersistentData());
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
