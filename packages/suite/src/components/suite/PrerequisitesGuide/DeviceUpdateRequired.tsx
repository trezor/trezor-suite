import { MouseEventHandler } from 'react';
import { Button } from '@trezor/components';

import { Translation, TroubleshootingTips } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';

export const DeviceUpdateRequired = () => {
    const dispatch = useDispatch();

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(goto('firmware-index'));
    };

    return (
        <TroubleshootingTips
            label={<Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />}
            cta={
                <Button onClick={handleClick}>
                    <Translation id="TR_SEE_DETAILS" />
                </Button>
            }
            items={[
                {
                    key: 'device-firmware-required',
                    heading: <Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />,
                    description: <Translation id="TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED" />,
                },
            ]}
        />
    );
};
