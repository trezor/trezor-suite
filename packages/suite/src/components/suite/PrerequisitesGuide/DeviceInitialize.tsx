import { MouseEvent } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { Banner } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';

import {
    enableOnboardingReducer,
    resetOnboarding,
    updateAnalytics,
} from 'src/actions/onboarding/onboardingActions';
import { goto } from 'src/actions/suite/routerActions';
import { TroubleshootingTips } from 'src/components/suite/troubleshooting/TroubleshootingTips';
import { useDispatch } from 'src/hooks/suite';
import { useStore } from 'src/hooks/suite/useStore';
import { useAnalytics } from 'src/support/useAnalytics';

export const DeviceInitialize = () => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const { getState } = useStore();

    const handleCtaClick = (e: MouseEvent) => {
        e.stopPropagation();
        // in case this prerequisite (device-initialize) is displayed inside onboarding app we need to reset onboarding state
        dispatch(resetOnboarding());
        // and resetting state disables onboarding reducer so we need to enable it again
        dispatch(enableOnboardingReducer(true));

        dispatch(updateAnalytics({ startTime: Date.now() }));

        const device = selectSelectedDevice(getState());

        analytics.report({
            type: events.deviceSetupStartedEvent.name,
            payload: {
                deviceModel: device?.features?.internal_model || DeviceModelInternal.UNKNOWN,
            },
        });
        dispatch(goto('onboarding-index'));
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
                    icon: 'trezorBody',
                },
            ]}
        />
    );
};
