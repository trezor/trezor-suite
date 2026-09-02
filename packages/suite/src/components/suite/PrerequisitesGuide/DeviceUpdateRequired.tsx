import { type MouseEventHandler } from 'react';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { Banner } from '@trezor/components';
import { ArrowsClockwiseIcon } from '@trezor/icons';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';

export const DeviceUpdateRequired = () => {
    const dispatch = useDispatch();

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(gotoThunk({ routeName: 'firmware-index' }));
    };

    return (
        <TroubleshootingTips
            label={<Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />}
            cta={
                <Banner.Button onClick={handleClick}>
                    <Translation id="TR_JUST_INSTALL" />
                </Banner.Button>
            }
            intent="warning"
            items={[
                {
                    key: 'device-firmware-required',
                    heading: <Translation id="FW_CAPABILITY_UPDATE_REQUIRED" />,
                    description: <Translation id="TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED" />,
                    icon: ArrowsClockwiseIcon,
                },
            ]}
        />
    );
};
