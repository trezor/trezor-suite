import { type MouseEventHandler } from 'react';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { Banner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CpuIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';

export const DeviceFirmwareCorrupted = () => {
    const { dispatch } = useServices(injectDispatch);

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(gotoThunk({ routeName: 'firmware-index' }));
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
                    icon: CpuIcon,
                },
            ]}
        />
    );
};
