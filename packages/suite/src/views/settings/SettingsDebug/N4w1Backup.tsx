import { Switch } from '@trezor/components';

import { setDebugMode } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

import { selectIsN4w1BackupEnabled } from '../../../selectors/suite/suiteSelectors';

export const N4w1Backup = () => {
    const isN4w1BackupEnabled = useSelector(selectIsN4w1BackupEnabled);
    const dispatch = useDispatch();

    const toggle = () => dispatch(setDebugMode({ isN4w1BackupEnabled: !isN4w1BackupEnabled }));

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
