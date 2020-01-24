import React from 'react';

import { Translation } from '@suite-components';
import * as STEP from '@onboarding-constants/steps';
import { Text, Option, Wrapper } from '@onboarding-components';
import messages from '@suite/support/messages';
import { Props } from './Container';

const CreateOrRecoverStep = (props: Props) => {
    return (
        <Wrapper.Step>
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
                        text="If you never had any Wallet or want to create fresh one"
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
                        text="Using either your single backup seed or Shamir backup seed"
                        button="Restore existing wallet"
                        imgSrc="images/onboarding/recover-from-seed.svg"
                    />
                </Wrapper.Options>
            </Wrapper.StepBody>
        </Wrapper.Step>
    );
};

export default CreateOrRecoverStep;
