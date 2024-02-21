// TODO: remove whole file, replaced by @suite-components/PrerequisitesGuide/components/DeviceUnreadable

import { goto } from 'src/actions/suite/routerActions';
import { Button } from '@trezor/components';
import { DeviceInvalidModeLayout, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const DeviceUnreadable = () => {
    const dispatch = useDispatch();

    const handleClick = () => dispatch(goto('suite-bridge'));

    return (
        <DeviceInvalidModeLayout
            data-test-id="@device-invalid-mode/unreadable"
            title={<Translation id="TR_UNREADABLE" />}
            text={<Translation id="TR_UNREADABLE_EXPLAINED" />}
            resolveButton={
                <Button onClick={handleClick}>
                    <Translation id="TR_SEE_DETAILS" />
                </Button>
            }
            allowSwitchDevice
        />
    );
};
