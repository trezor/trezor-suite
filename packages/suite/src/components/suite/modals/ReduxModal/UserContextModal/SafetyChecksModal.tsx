import { useState } from 'react';
import styled from 'styled-components';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { Radio, Button, H3, Paragraph, Warning } from '@trezor/components';
import { Translation, Modal, ModalProps } from 'src/components/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';

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

const RadioInner = styled.div`
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
export const SafetyChecksModal = ({ onCancel }: ModalProps) => {
    const { device, isLocked } = useDevice();
    const [level, setLevel] = useState(device?.features?.safety_checks || undefined);
    const dispatch = useDispatch();

    const confirm = () => dispatch(applySettings({ safety_checks: level }));

    return (
        <Modal
            isCancelable
            onCancel={onCancel}
            heading={<Translation id="TR_SAFETY_CHECKS_MODAL_TITLE" />}
            bottomBarComponents={
                <StyledButton
                    onClick={confirm}
                    // Only allow confirming when the value will be changed.
                    isDisabled={isLocked() || level === device?.features?.safety_checks}
                    data-test="@safety-checks-apply"
                >
                    <Translation id="TR_CONFIRM" />
                </StyledButton>
            }
        >
            <OptionsWrapper>
                <Radio
                    isChecked={level === 'Strict'}
                    onClick={() => setLevel('Strict')}
                    data-test="@radio-button-strict"
                >
                    <RadioInner>
                        <H3>
                            <Translation id="TR_SAFETY_CHECKS_STRICT_LEVEL" />
                        </H3>
                        <Paragraph type="hint">
                            <Translation id="TR_SAFETY_CHECKS_STRICT_LEVEL_DESC" />
                        </Paragraph>
                    </RadioInner>
                </Radio>
                <Radio
                    // For the purpose of this modal consider `PromptAlways` as identical to `PromptTemporarily`.
                    isChecked={level === 'PromptTemporarily' || level === 'PromptAlways'}
                    onClick={() => setLevel('PromptTemporarily')}
                    data-test="@radio-button-prompt"
                >
                    <RadioInner>
                        <H3>
                            <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL" />
                        </H3>
                        <StyledWarning withIcon>
                            <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL_WARNING" />
                        </StyledWarning>
                        <Paragraph type="hint">
                            <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL_DESC" />
                        </Paragraph>
                    </RadioInner>
                </Radio>
            </OptionsWrapper>
        </Modal>
    );
};
