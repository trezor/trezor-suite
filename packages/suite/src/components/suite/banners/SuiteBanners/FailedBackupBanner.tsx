import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Banner } from '@trezor/components';
import { SettingsAnchor } from 'src/constants/suite/anchors';

export const FailedBackup = () => {
    const dispatch = useDispatch();

    return (
        <Banner
            icon
            variant="destructive"
            rightContent={
                <Banner.Button
                    onClick={() =>
                        dispatch(goto('settings-device', { anchor: SettingsAnchor.BackupFailed }))
                    }
                    data-testid="@notification/failed-backup/cta"
                >
                    <Translation id="TR_CONTINUE" />
                </Banner.Button>
            }
        >
            <Translation id="TR_FAILED_BACKUP" />
        </Banner>
    );
};
