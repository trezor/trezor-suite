import { MouseEventHandler } from 'react';

import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import { useDispatch } from 'src/hooks/suite';

export const DeviceNoFirmware = () => {
    const dispatch = useDispatch();

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(goto('onboarding-index'));
    };

    return (
        <TroubleshootingTips
            label={<Translation id="TR_NO_FIRMWARE" />}
            cta={
                <Banner.Button onClick={handleClick}>
                    <Translation id="TR_GO_TO_ONBOARDING" />
                </Banner.Button>
            }
            intent="info"
            items={[
                {
                    key: 'device-firmware-missing',
                    heading: <Translation id="TR_NO_FIRMWARE" />,
                    description: <Translation id="TR_NO_FIRMWARE_EXPLAINED" />,
                    icon: 'cpu',
                },
            ]}
        />
    );
};
