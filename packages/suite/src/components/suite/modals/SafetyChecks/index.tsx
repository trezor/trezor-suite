import React, { useState } from 'react';
import styled from 'styled-components';
import { useActions, useDevice } from '@suite-hooks';
import { RadioButton, Button, H3, P, Warning } from '@trezor/components';
import { Translation, Modal, ModalProps } from '@suite-components';
import * as deviceSettingsActions from '@settings-actions/deviceSettingsActions';

const StyledButton = styled(Button)`
    min-width: 230px;
`;

const OptionsWrapper = styled.div`
    width: 100%;
    text-align: left;
    margin: 20px 0 40px;

    & > * + * {
        margin-top: 40px;
    }
`;

const RadioButtonInner = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

const StyledWarning = styled(Warning)`
    margin: 12px 0;
`;

/**
 * A Modal that allows user to set the `safety_checks` feature of connected Trezor.
 * Only supports setting it to `Strict` or `PromptTemporarily`.
 * The third value, `PromptAlways`, is considered an advanced feature that can be
 * set only via command line and trezor-lib.
 */
export const SafetyChecks = ({ onCancel }: ModalProps) => {
    const { device, isLocked } = useDevice();
    const { applySettings } = useActions({ applySettings: deviceSettingsActions.applySettings });
    const [level, setLevel] = useState(device?.features?.safety_checks || undefined);

    return (
        <Modal
            isCancelable
            onCancel={onCancel}
            heading={<Translation id="TR_SAFETY_CHECKS_MODAL_TITLE" />}
            bottomBar={
                <StyledButton
                    onClick={() => {
                        applySettings({ safety_checks: level });
                    }}
                    // Only allow confirming when the value will be changed.
                    isDisabled={isLocked() || level === device?.features?.safety_checks}
                    data-test="@safety-checks-apply"
                >
                    <Translation id="TR_CONFIRM" />
                </StyledButton>
            }
        >
            <OptionsWrapper>
                <RadioButton
                    isChecked={level === 'Strict'}
                    onClick={() => setLevel('Strict')}
                    data-test="@radio-button-strict"
                >
                    <RadioButtonInner>
                        <H3>
                            <Translation id="TR_SAFETY_CHECKS_STRICT_LEVEL" />
                        </H3>
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
                        <H3>
                            <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL" />
                        </H3>
                        <StyledWarning withIcon>
                            <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL_WARNING" />
                        </StyledWarning>
                        <P size="small">
                            <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL_DESC" />
                        </P>
                    </RadioButtonInner>
                </RadioButton>
            </OptionsWrapper>
        </Modal>
    );
};
