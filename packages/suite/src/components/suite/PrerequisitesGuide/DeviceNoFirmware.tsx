import { type MouseEventHandler } from 'react';

import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { CpuIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { startOnboardingThunk } from '#src/actions/onboarding/startOnboardingThunk';
import { TroubleshootingTips } from '#src/components/suite/troubleshooting/TroubleshootingTips';

export const DeviceNoFirmware = () => {
    const { dispatch } = useServices(injectDispatch);

    const handleClick: MouseEventHandler = e => {
        e.stopPropagation();
        dispatch(startOnboardingThunk({ shouldRestart: true }));
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
                    icon: CpuIcon,
                },
            ]}
        />
    );
};
