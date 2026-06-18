import { onReceiveConfirmation } from '@suite/modal';
import { SettingsAnchor, goto } from '@suite/router';

import { useDispatch } from 'src/hooks/suite/useDispatch';

import { NoBackupModalView } from './NoBackupModalView';

export const NoBackupModal = () => {
    const dispatch = useDispatch();

    const onConfirm = () => dispatch(onReceiveConfirmation(true));
    const onCancel = () => dispatch(onReceiveConfirmation(false));
    const onCreateBackup = () => {
        onCancel();
        dispatch(goto({ routeName: 'settings-device', anchor: SettingsAnchor.BackupRecoverySeed }));
    };

    return (
        <NoBackupModalView
            onConfirm={onConfirm}
            onCancel={onCancel}
            onCreateBackup={onCreateBackup}
        />
    );
};
