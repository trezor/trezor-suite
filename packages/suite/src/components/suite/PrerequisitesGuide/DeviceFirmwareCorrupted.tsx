import { type MouseEventHandler } from 'react';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { Banner } from '@trezor/components';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import { useDispatch } from 'src/hooks/suite';

export const DeviceFirmwareCorrupted = () => {
    const dispatch = useDispatch();

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(goto({ routeName: 'firmware-index' }));
    };

    return (
        <TroubleshootingTips
            label={<Translation id="FW_CORRUPTED_REINSTALL_REQUIRED" />}
            cta={
                <Banner.Button onClick={handleClick}>
                    <Translation id="TR_JUST_INSTALL" />
                </Banner.Button>
            }
            intent="warning"
            items={[
                {
                    key: 'device-firmware-corrupted',
                    heading: <Translation id="FW_CORRUPTED_REINSTALL_REQUIRED" />,
                    description: <Translation id="TR_FIRMWARE_CORRUPTED_REQUIRED_EXPLAINED" />,
                    icon: 'cpu',
                },
            ]}
        />
    );
};
