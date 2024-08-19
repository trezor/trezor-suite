import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Warning } from '@trezor/components';
import { SettingsAnchor } from 'src/constants/suite/anchors';

export const FailedBackup = () => {
    const dispatch = useDispatch();

    return (
        <Warning
            icon
            variant="destructive"
            rightContent={
                <Warning.Button
                    onClick={() =>
                        dispatch(goto('settings-device', { anchor: SettingsAnchor.BackupFailed }))
                    }
                    data-testid="@notification/failed-backup/cta"
                >
                    <Translation id="TR_CONTINUE" />
                </Warning.Button>
            }
        >
            <Translation id="TR_FAILED_BACKUP" />
        </Warning>
    );
};
