import { type MouseEvent } from 'react';

import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { TrezorBodyIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { startOnboardingThunk } from '#src/actions/onboarding/startOnboardingThunk';
import { TroubleshootingTips } from '#src/components/suite/troubleshooting/TroubleshootingTips';

export const DeviceInitialize = () => {
    const { dispatch } = useServices(injectDispatch);

    const handleCtaClick = (e: MouseEvent) => {
        e.stopPropagation();
        dispatch(startOnboardingThunk({ shouldRestart: true }));
    };

    return (
        <TroubleshootingTips
            label={<Translation id="TR_DEVICE_NOT_INITIALIZED" />}
            intent="brand"
            cta={
                <Banner.Button data-testid="@button/go-to-onboarding" onClick={handleCtaClick}>
                    <Translation id="TR_GO_TO_ONBOARDING" />
                </Banner.Button>
            }
            items={[
                {
                    key: 'device-initialize',
                    heading: <Translation id="TR_DEVICE_NOT_INITIALIZED" />,
                    description: <Translation id="TR_DEVICE_NOT_INITIALIZED_TEXT" />,
                    icon: TrezorBodyIcon,
                },
            ]}
        />
    );
};
