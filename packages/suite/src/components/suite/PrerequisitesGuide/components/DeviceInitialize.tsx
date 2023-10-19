import { MouseEvent } from 'react';
import { Button } from '@trezor/components';
import { Translation, TroubleshootingTips } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { enableOnboardingReducer, resetOnboarding } from 'src/actions/onboarding/onboardingActions';

export const DeviceInitialize = () => {
    const dispatch = useDispatch();

    const handleCtaClick = (e: MouseEvent) => {
        e.stopPropagation();
        // in case this prerequisite (device-initialize) is displayed inside onboarding app we need to reset onboarding state
        dispatch(resetOnboarding());
        // and resetting state disables onboarding reducer so we need to enable it again
        dispatch(enableOnboardingReducer(true));

        dispatch(goto('onboarding-index'));
    };

    return (
        <TroubleshootingTips
            label={<Translation id="TR_DEVICE_NOT_INITIALIZED" />}
            cta={
                <Button data-test="@button/go-to-onboarding" onClick={handleCtaClick}>
                    <Translation id="TR_GO_TO_ONBOARDING" />
                </Button>
            }
            items={[
                {
                    key: 'device-initialize',
                    heading: <Translation id="TR_DEVICE_NOT_INITIALIZED" />,
                    description: <Translation id="TR_DEVICE_NOT_INITIALIZED_TEXT" />,
                },
            ]}
        />
    );
};
