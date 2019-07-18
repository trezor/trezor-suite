import React from 'react';
import { Button } from '@trezor/components';
import * as STEP from '@onboarding-constants/steps';

// import { FormattedMessage } from 'react-intl';

import Text from '@suite/components/onboarding/Text';
import { OnboardingReducer } from '@onboarding-types/onboarding';

import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';
import { goToNextStep, setPath } from '@onboarding-actions/onboardingActions';

// import l10nMessages from './index.messages';

interface Props {
    path: OnboardingReducer['path'];
    onboardingActions: {
        goToNextStep: typeof goToNextStep;
        setPath: typeof setPath;
    };
}

const NewOrUsedStep = (props: Props) => (
    <StepWrapper>
        <StepHeadingWrapper>
            Do you want to use new or used device?
            {/* <FormattedMessage {...l10nMessages.TR_RECOVERY_HEADING} /> */}
        </StepHeadingWrapper>
        <StepBodyWrapper>
            <Text>
                Trezor Wallet is your account within Trezor ecosystem. It allows you to easily
                manage your funds and initiate transfers.
            </Text>
            <ControlsWrapper isVertical>
                <Button
                    data-test="button-new-device"
                    onClick={() => {
                        props.onboardingActions.setPath([...props.path, STEP.PATH_NEW]);
                        props.onboardingActions.goToNextStep();
                    }}
                >
                    New device
                </Button>
                <Button
                    isWhite
                    data-test="button-new-device"
                    onClick={() => {
                        props.onboardingActions.setPath([...props.path, STEP.PATH_USED]);
                        props.onboardingActions.goToNextStep();
                    }}
                >
                    Used device
                </Button>
            </ControlsWrapper>
        </StepBodyWrapper>
    </StepWrapper>
);

export default NewOrUsedStep;
