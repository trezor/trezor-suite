import { selectIsUnlockedBootloaderAllowed, suiteSettingsActions } from '@suite/settings';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { Switch } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const DeviceAuthenticity = () => {
    const { dispatch } = useServices(injectDispatch);
    const isUnlockedBootloaderAllowed = useSelector(selectIsUnlockedBootloaderAllowed);

    const handleChange = (state: boolean) =>
        dispatch(suiteSettingsActions.setDebugMode({ isUnlockedBootloaderAllowed: state }));

    return (
        <SectionItem
            data-testid="@settings/debug/device-authenticity/switch"
            title="Allow unlocked bootloader"
            description="Skip device authenticity check when bootloader is unlocked."
            actions={<Switch onChange={handleChange} isChecked={isUnlockedBootloaderAllowed} />}
        />
    );
};
