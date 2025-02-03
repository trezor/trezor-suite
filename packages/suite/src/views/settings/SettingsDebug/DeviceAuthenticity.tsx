import { Switch } from '@trezor/components';

import { setDebugMode } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const DeviceAuthenticity = () => {
    const dispatch = useDispatch();
    const debug = useSelector(state => state.suite.settings.debug);

    const handleChange = (state: boolean) =>
        dispatch(setDebugMode({ isUnlockedBootloaderAllowed: state }));

    return (
        <SectionItem data-testid="@settings/debug/device-authenticity/switch">
            <TextColumn
                title="Allow unlocked bootloader"
                description="Skip device authenticity check when bootloader is unlocked."
            />
            <ActionColumn>
                <Switch onChange={handleChange} isChecked={debug.isUnlockedBootloaderAllowed} />
            </ActionColumn>
        </SectionItem>
    );
};
