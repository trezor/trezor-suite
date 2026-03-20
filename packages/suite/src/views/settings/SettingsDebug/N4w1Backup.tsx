import { selectIsN4w1BackupEnabled, suiteSettingsActions } from '@suite/settings';
import { Switch } from '@trezor/components';

import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const N4w1Backup = () => {
    const isN4w1BackupEnabled = useSelector(selectIsN4w1BackupEnabled);
    const dispatch = useDispatch();

    const toggle = () =>
        dispatch(suiteSettingsActions.setDebugMode({ isN4w1BackupEnabled: !isN4w1BackupEnabled }));

    return (
        <SectionItem>
            <TextColumn
                title="N4W1 Backup"
                description="Enable Trezor device N4W1 backup features."
            />
            <ActionColumn>
                <Switch isChecked={isN4w1BackupEnabled} onChange={toggle} />
            </ActionColumn>
        </SectionItem>
    );
};
