import React from 'react';
import { Translation } from '@suite-components';
import { OnboardingButtonCta, OnboardingStepBox } from '@onboarding-components';

import * as suiteActions from '@suite-actions/suiteActions';
import { useActions } from '@suite-hooks';

const DeviceIsUsedHere = () => {
    const { actionCta } = useActions({ actionCta: suiteActions.acquireDevice });

    return (
        <OnboardingStepBox
            disableConfirmWrapper
            heading={<Translation id="TR_DEVICE_IS_USED_IN_OTHER_WINDOW_HEADING" />}
            description={<Translation id="TR_DEVICE_IS_USED_IN_OTHER_WINDOW_TEXT" />}
            innerActions={
                <OnboardingButtonCta onClick={() => actionCta()}>
                    <Translation id="TR_DEVICE_IS_USED_IN_OTHER_WINDOW_BUTTON" />
                </OnboardingButtonCta>
            }
        />
    );
};

export default DeviceIsUsedHere;
