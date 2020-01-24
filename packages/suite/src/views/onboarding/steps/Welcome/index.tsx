import React from 'react';

import { Translation } from '@suite-components';
import * as STEP from '@onboarding-constants/steps';
import { OnboardingButton, Text, Option, Wrapper } from '@onboarding-components';
import messages from '@suite/support/messages';
import { Props } from './Container';

const WelcomeStep = (props: Props) => {
    return (
        <Wrapper.Step data-test="onboarding_first_page">
            <Wrapper.StepBody>
                <Wrapper.StepHeading>
                    <Translation {...messages.TR_WELCOME_TO_TREZOR} />
                </Wrapper.StepHeading>

                <Text>
                    <Translation {...messages.TR_WELCOME_TO_TREZOR_TEXT} />
                </Text>

                <Wrapper.Options>
                    <Option
                        data-test="@onboarding/button-path-create"
                        action={() => {
                            props.addPath(STEP.PATH_CREATE);
                            props.goToNextStep();
                        }}
                        title="Create new Wallet"
                        text="if you never had any Wallet"
                        button="Create a new Wallet"
                        imgSrc="images/onboarding/create-new.svg"
                    />
                    <Option
                        data-test="button-path-recovery"
                        action={() => {
                            props.addPath(STEP.PATH_RECOVERY);
                            props.goToNextStep();
                        }}
                        title="Restore existing wallet"
                        text="using your backup seed"
                        button="Restore"
                        imgSrc="images/onboarding/recover-from-seed.svg"
                    />
                </Wrapper.Options>
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <OnboardingButton.Back data-test="button-use-wallet" onClick={props.closeModalApp}>
                    <Translation {...messages.TR_BACK} />
                </OnboardingButton.Back>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default WelcomeStep;
