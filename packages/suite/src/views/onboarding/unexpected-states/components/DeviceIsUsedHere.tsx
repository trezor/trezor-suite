import React from 'react';
import { Translation } from '@suite-components';
import { OnboardingButton } from '@onboarding-components';

import * as suiteActions from '@suite-actions/suiteActions';
import { useActions } from '@suite-hooks';
import { OnboardingStepBox } from '@suite/components/firmware';

const DeviceIsUsedHere = () => {
    const { actionCta } = useActions({ actionCta: suiteActions.acquireDevice });

    return (
        <OnboardingStepBox
            disableConfirmWrapper
            heading={<Translation id="TR_DEVICE_IS_USED_IN_OTHER_WINDOW_HEADING" />}
            description={<Translation id="TR_DEVICE_IS_USED_IN_OTHER_WINDOW_TEXT" />}
            innerActions={
                <OnboardingButton.Cta onClick={() => actionCta()}>
                    <Translation id="TR_DEVICE_IS_USED_IN_OTHER_WINDOW_BUTTON" />
                </OnboardingButton.Cta>
            }
        />
    );
};

export default DeviceIsUsedHere;
