import React, { useState } from 'react';
import { Input } from '@trezor/components';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

import messages from '@suite/support/messages';
import { isASCII } from '@suite-utils/validators';
import { DEFAULT_LABEL } from '@onboarding-constants/trezor';
import { Wrapper, OnboardingButton, Text } from '@onboarding-components';
import { Props } from './Container';

interface NameInputProps {
    value: string;
}
const NameInput = styled(Input)<NameInputProps>`
    max-width: 400px;
    min-height: 65px;
`;

const NameStep = (props: Props) => {
    const [label, setLabel] = useState('');

    const { device } = props;

    if (!device || !device.features) {
        return null;
    }

    const changeLabel = () => {
        props.connectActions.applySettings({ label });
    };

    const handleInputChange = (event: any) => {
        setLabel(event.target.value);
    };

    const getStatus = () => {
        if (device.label !== DEFAULT_LABEL) {
            return 'changed';
        }
        return 'initial';
    };

    const validateInput = (): { state: undefined | 'error' | 'success'; bottomText?: string } => {
        if (!label) {
            return { state: undefined };
        }
        if (label === DEFAULT_LABEL) {
            return {
                state: 'error',
                bottomText: props.intl.formatMessage(messages.TR_NAME_BORING),
            };
        }
        if (!isASCII(label)) {
            return {
                state: 'error',
                bottomText: props.intl.formatMessage(messages.TR_NAME_ONLY_ASCII),
            };
        }
        if (label.length > 16) {
            return {
                state: 'error',
                bottomText: props.intl.formatMessage(messages.TR_NAME_TOO_LONG),
            };
        }
        return {
            state: 'success',
            bottomText: props.intl.formatMessage(messages.TR_NAME_OK),
        };
    };

    const status = getStatus();
    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {status === 'initial' && <Translation {...messages.TR_NAME_HEADING} />}
                {status === 'changed' && (
                    <Translation
                        {...messages.TR_NAME_HEADING_CHANGED}
                        values={{ label: device!.features!.label }}
                    />
                )}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {status === 'initial' && (
                    <>
                        <Text>
                            <Translation {...messages.TR_NAME_SUBHEADING} />
                        </Text>

                        <NameInput
                            value={label}
                            placeholder=""
                            state={validateInput().state}
                            bottomText={
                                validateInput().bottomText ? validateInput().bottomText : ''
                            }
                            onChange={handleInputChange}
                            isDisabled={props.deviceCall.isProgress}
                        />

                        <Wrapper.Controls>
                            <OnboardingButton.Alt
                                onClick={() => props.onboardingActions.goToNextStep()}
                            >
                                <Translation {...messages.TR_SKIP} />
                            </OnboardingButton.Alt>
                            <OnboardingButton.Cta
                                isDisabled={validateInput().state !== 'success'}
                                onClick={changeLabel}
                            >
                                <Translation {...messages.TR_SUBMIT} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}

                {status === 'changed' && (
                    <>
                        <Text>
                            <Translation {...messages.TR_NAME_CHANGED_TEXT} />
                        </Text>
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => props.onboardingActions.goToNextStep()}
                            >
                                <Translation {...messages.TR_CONTINUE} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>
        </Wrapper.Step>
    );
};

export default NameStep;
