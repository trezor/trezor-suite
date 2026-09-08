import { type MouseEvent } from 'react';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { selectDispatch, selectGetState } from '@suite-common/redux-utils';
import { Banner } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { TrezorBodyIcon } from '@trezor/icons';

import {
    armOnboardedDeviceTracking,
    resetOnboarding,
    updateAnalytics,
} from 'src/actions/onboarding/onboardingActions';
import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';

export const DeviceInitialize = () => {
    const { analytics, dispatch, getState } = useServices(
        selectDesktopAnalyticsDep,
        selectDispatch,
        selectGetState,
    );

    const handleCtaClick = (e: MouseEvent) => {
        e.stopPropagation();
        // in case this prerequisite (device-initialize) is displayed inside onboarding app we need to reset onboarding state
        dispatch(resetOnboarding());

        dispatch(updateAnalytics({ startTime: Date.now() }));

        const device = selectSelectedDevice(getState());

        // Onboarding begins here, and this is the last moment the selection is guaranteed to be
        // the device the user meant: from now on it installs firmware and wipes the device, so it
        // disconnects and the selection drifts. Pin the flow to it. See `selectOnboardedDevice`.
        if (device?.connected) {
            dispatch(armOnboardedDeviceTracking(device));
        }

        analytics.report(
            {
                type: events.deviceSetupStartedEvent.name,
                payload: {
                    deviceModel: device?.features?.internal_model || DeviceModelInternal.UNKNOWN,
                },
            },
            { force: true },
        );
        dispatch(gotoThunk({ routeName: 'onboarding-index' }));
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
