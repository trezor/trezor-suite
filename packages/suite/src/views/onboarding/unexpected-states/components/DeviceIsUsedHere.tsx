import React from 'react';

import { H2, P } from '@trezor/components';
import { Translation } from '@suite-components';
import { Wrapper, OnboardingButton } from '@onboarding-components';

import * as suiteActions from '@suite-actions/suiteActions';
import { useActions } from '@suite-hooks';

const DeviceIsUsedHere = () => {
    const { actionCta } = useActions({ actionCta: suiteActions.acquireDevice });

    return (
        <>
            <H2>
                <Translation id="TR_DEVICE_IS_USED_IN_OTHER_WINDOW_HEADING" />
            </H2>
            <P size="small">
                <Translation id="TR_DEVICE_IS_USED_IN_OTHER_WINDOW_TEXT" />
            </P>
            <Wrapper.Controls>
                <OnboardingButton.Cta onClick={() => actionCta()}>
                    <Translation id="TR_DEVICE_IS_USED_IN_OTHER_WINDOW_BUTTON" />
                </OnboardingButton.Cta>
            </Wrapper.Controls>
        </>
    );
};

export default DeviceIsUsedHere;
