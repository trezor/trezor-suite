import React from 'react';

import { Translation } from '@suite-components';
import { Text, Option, Wrapper } from '@onboarding-components';

import { Props } from './Container';

const WelcomeStep = (props: Props) => {
    return (
        <Wrapper.Step data-test="@onboarding/welcome-step">
            <Wrapper.StepBody>
                <Wrapper.StepHeading>
                    <Translation id="TR_WELCOME_TO_TREZOR" />
                </Wrapper.StepHeading>

                <Text>
                    <Translation id="TR_WELCOME_TO_TREZOR_TEXT" />
                </Text>

                <Wrapper.Options>
                    <Option
                        data-test="@onboarding/begin-button"
                        action={() => {
                            props.goToNextStep('create-or-recover');
                        }}
                        title={<Translation id="TR_IM_NEW_TO_ALL_THIS" />}
                        text={<Translation id="TR_I_WANT_TO_BE_GUIDED_THROUGH" />}
                        button={<Translation id="TR_BEGIN_ONBOARDING" />}
                        imgSrc="images/svg/new-user.svg"
                    />
                    <Option
                        data-test="@onboarding/skip-button"
                        action={() => {
                            props.goToNextStep('skip');
                        }}
                        title={<Translation id="TR_I_HAVE_INITIALIZED_DEVICE" />}
                        text={<Translation id="TR_MY_DEVICE_IS_INITIALIZED" />}
                        button={<Translation id="TR_SKIP_ONBOARDING" />}
                        imgSrc="images/svg/existing-user.svg"
                    />
                </Wrapper.Options>
            </Wrapper.StepBody>
        </Wrapper.Step>
    );
};

export default WelcomeStep;
