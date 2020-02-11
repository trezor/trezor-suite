import React from 'react';

import { Translation } from '@suite-components';
import { Text, Option, Wrapper } from '@onboarding-components';
import messages from '@suite/support/messages';
import { Props } from './Container';

const WelcomeStep = (props: Props) => {
    return (
        <Wrapper.Step data-test="@onboarding/welcome-step">
            <Wrapper.StepBody>
                <Wrapper.StepHeading>
                    <Translation {...messages.TR_WELCOME_TO_TREZOR} />
                </Wrapper.StepHeading>

                <Text>
                    <Translation {...messages.TR_WELCOME_TO_TREZOR_TEXT} />
                </Text>

                <Wrapper.Options>
                    <Option
                        data-test="@onboarding/begin-button"
                        action={() => {
                            props.goToNextStep('create-or-recover');
                        }}
                        title="I'm new to all this"
                        text="I want to be guided through onboarding process"
                        button="Begin onboarding"
                        imgSrc="images/onboarding/new-user.svg"
                    />
                    <Option
                        data-test="@onboarding/skip-button"
                        action={() => {
                            props.goToNextStep('skip');
                        }}
                        title="I have initialized device"
                        text="My device is initialized and I used Wallet or Suite before"
                        button="Skip onboarding"
                        imgSrc="images/onboarding/existing-user.svg"
                    />
                </Wrapper.Options>
            </Wrapper.StepBody>
        </Wrapper.Step>
    );
};

export default WelcomeStep;
