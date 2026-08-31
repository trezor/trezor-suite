import { useDispatch } from 'react-redux';

import { selectIsUnlockedBootloaderAllowed, suiteSettingsActions } from '@suite/settings';
import { useSelector } from '@suite-common/redux-utils';
import { Switch } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
export const DeviceAuthenticity = () => {
    const dispatch = useDispatch();
    const isUnlockedBootloaderAllowed = useSelector(selectIsUnlockedBootloaderAllowed);

    const handleChange = (state: boolean) =>
        dispatch(suiteSettingsActions.setDebugMode({ isUnlockedBootloaderAllowed: state }));

    return (
        <SectionItem data-testid="@settings/debug/device-authenticity/switch">
            <TextColumn
                title="Allow unlocked bootloader"
                description="Skip device authenticity check when bootloader is unlocked."
            />
            <ActionColumn>
                <Switch onChange={handleChange} isChecked={isUnlockedBootloaderAllowed} />
            </ActionColumn>
        </SectionItem>
    );
};
