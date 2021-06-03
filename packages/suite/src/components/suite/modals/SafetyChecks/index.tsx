import React, { useState } from 'react';
import { useActions, useSelector } from '@suite-hooks';
import { RadioButton, Button, H2, P, Warning } from '@trezor/components';
import { Translation, Modal, ModalProps } from '@suite-components';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';
import styled from 'styled-components';

const Buttons = styled.div`
    display: flex;
    width: 100%;
`;

const OptionsWrapper = styled.div`
    width: 100%;
    text-align: left;
    margin: 20px 0 50px;
    & > * + * {
        margin-top: 50px;
    }
`;

const RadioButtonInner = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

const WarningWrapper = styled.div`
    margin-bottom: 18px;
`;

/**
 * A Modal that allows user to set the `safety_checks` feature of connected Trezor.
 * Only supports setting it to `Strict` or `PromptTemporarily`.
 * The third value, `PromptAlways`, is considered an advanced feature that can be
 * set only via command line and trezor-lib.
 */
const SafetyChecks = (props: ModalProps) => {
    const device = useSelector(state => state.suite.device);
    const { applySettings } = useActions({ applySettings: deviceSettingsActions.applySettings });
    const [level, setLevel] = useState(device?.features?.safety_checks || undefined);

    const ApplyButton = (
        <Buttons>
            <Button
                onClick={() => {
                    applySettings({ safety_checks: level });
                }}
                // Only allow confirming when the value will be changed.
                isDisabled={level === device?.features?.safety_checks}
                data-test="@safety-checks-apply"
            >
                <Translation id="TR_CONFIRM" />
            </Button>
        </Buttons>
    );

    return (
        <Modal
            cancelable
            onCancel={props.onCancel}
            heading={<Translation id="TR_SAFETY_CHECKS_MODAL_TITLE" />}
            bottomBar={ApplyButton}
        >
            <OptionsWrapper>
                <RadioButton
                    isChecked={level === 'Strict'}
                    onClick={() => setLevel('Strict')}
                    data-test="@radio-button-strict"
                >
                    <RadioButtonInner>
                        <H2>
                            <Translation id="TR_SAFETY_CHECKS_STRICT_LEVEL" />
                        </H2>
                        <P size="small">
                            <Translation id="TR_SAFETY_CHECKS_STRICT_LEVEL_DESC" />
                        </P>
                    </RadioButtonInner>
                </RadioButton>
                <RadioButton
                    // For the purpose of this modal consider `PromptAlways` as identical to `PromptTemporarily`.
                    isChecked={level === 'PromptTemporarily' || level === 'PromptAlways'}
                    onClick={() => setLevel('PromptTemporarily')}
                    data-test="@radio-button-prompt"
                >
                    <RadioButtonInner>
                        <H2>
                            <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL" />
                        </H2>
                        <WarningWrapper>
                            <Warning>
                                <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL_WARNING" />
                            </Warning>
                        </WarningWrapper>
                        <P size="small">
                            <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL_DESC" />
                        </P>
                    </RadioButtonInner>
                </RadioButton>
            </OptionsWrapper>
        </Modal>
    );
};

export default SafetyChecks;
