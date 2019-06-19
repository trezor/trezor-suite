import React from 'react';
import { Button } from '@trezor/components';
// import { FormattedMessage } from 'react-intl';

import Text from '@suite/components/onboarding/Text';

import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';
import { OnboardingActions } from '@suite/types/onboarding/onboarding';

// import l10nMessages from './index.messages';

interface Props {
    onboardingActions: OnboardingActions;
}

const NewOrUsedStep = (props: Props) => (
    <StepWrapper>
        <StepHeadingWrapper>
            Do you want to use new or used device?
            {/* <FormattedMessage {...l10nMessages.TR_RECOVERY_HEADING} /> */}
        </StepHeadingWrapper>
        <StepBodyWrapper>
            <>
                <Text>
                    Trezor Wallet is your account within Trezor ecosystem. It allows you to easily
                    manage your funds and initiate transfers.
                </Text>
                <ControlsWrapper isVertical>
                    <Button
                        data-test="button-new-device"
                        onClick={() => {
                            props.onboardingActions.setAsNewDevice(true);
                            props.onboardingActions.goToNextStep();
                        }}
                    >
                        New device
                    </Button>
                    <Button
                        isWhite
                        data-test="button-new-device"
                        onClick={() => {
                            props.onboardingActions.setAsNewDevice(false);
                            props.onboardingActions.goToNextStep();
                        }}
                    >
                        Used device
                    </Button>
                </ControlsWrapper>
            </>
        </StepBodyWrapper>
    </StepWrapper>
);

export default NewOrUsedStep;
