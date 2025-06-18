import { Switch } from '@trezor/components';

import { setAutoEjectDevice } from 'src/actions/suite/suiteActions';
import { ActionColumn, SectionItem, TextColumn } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectAutoEjectDevice } from 'src/reducers/suite/suiteReducer';

export const AutoEjectDevice = () => {
    const dispatch = useDispatch();
    const autoEjectEnabled = useSelector(selectAutoEjectDevice);

    const handleToggle = () => {
        dispatch(setAutoEjectDevice({ autoEjectDevice: !autoEjectEnabled }));
    };

    return (
        <SectionItem data-testid="@settings/device/auto-eject">
            <TextColumn
                title="Auto-eject wallets"
                description="Automatically eject wallets when device is disconnected"
            />
            <ActionColumn>
                <Switch
                    isChecked={autoEjectEnabled}
                    onChange={handleToggle}
                    data-testid="@settings/auto-eject-switch"
                />
            </ActionColumn>
        </SectionItem>
    );
};
