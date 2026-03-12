import { MouseEventHandler } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { Banner } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';

import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import { useDispatch } from 'src/hooks/suite';
import { useStore } from 'src/hooks/suite/useStore';
import { useAnalytics } from 'src/support/useAnalytics';

export const DeviceNoFirmware = () => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const { getState } = useStore();

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        const device = selectSelectedDevice(getState());

        analytics.report({
            type: events.deviceSetupStartedEvent.name,
            payload: {
                deviceModel: device?.features?.internal_model || DeviceModelInternal.UNKNOWN,
            },
        });
        dispatch(goto({ routeName: 'onboarding-index' }));
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
