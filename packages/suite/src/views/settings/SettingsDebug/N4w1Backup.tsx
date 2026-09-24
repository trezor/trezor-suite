import { selectIsN4w1BackupEnabled, suiteSettingsActions } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { Switch } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

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
