import { selectIsN4w1BackupEnabled, suiteSettingsActions } from '@suite/settings';
import { Switch } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { SectionItem } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

export const N4w1Backup = () => {
    const isN4w1BackupEnabled = useSelector(selectIsN4w1BackupEnabled);
    const { dispatch } = useServices(injectDispatch);

    const toggle = () =>
        dispatch(suiteSettingsActions.setDebugMode({ isN4w1BackupEnabled: !isN4w1BackupEnabled }));

    return (
        <SectionItem
            title="N4W1 Backup"
            description="Enable Trezor device N4W1 backup features."
            actions={<Switch isChecked={isN4w1BackupEnabled} onChange={toggle} />}
        />
    );
};
