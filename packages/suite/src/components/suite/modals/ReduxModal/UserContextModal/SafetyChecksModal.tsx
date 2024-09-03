import { useState } from 'react';
import { useDevice, useDispatch } from 'src/hooks/suite';
import {
    Radio,
    Paragraph,
    Banner,
    NewModal,
    NewModalProps,
    Column,
    Card,
    Text,
} from '@trezor/components';
import { Translation } from 'src/components/suite';
import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { spacings } from '@trezor/theme';

/**
 * A Modal that allows user to set the `safety_checks` feature of connected Trezor.
 * Only supports setting it to `Strict` or `PromptTemporarily`.
 * The third value, `PromptAlways`, is considered an advanced feature that can be
 * set only via command line and trezor-lib.
 */
export const SafetyChecksModal = ({ onCancel }: NewModalProps) => {
    const { device, isLocked } = useDevice();
    const [level, setLevel] = useState(device?.features?.safety_checks || undefined);
    const dispatch = useDispatch();

    const confirm = () => dispatch(applySettings({ safety_checks: level }));

    return (
        <NewModal
            onCancel={onCancel}
            heading={<Translation id="TR_SAFETY_CHECKS_MODAL_TITLE" />}
            variant="warning"
            size="small"
            bottomContent={
                <>
                    <NewModal.Button
                        onClick={confirm}
                        // Only allow confirming when the value will be changed.
                        isDisabled={isLocked() || level === device?.features?.safety_checks}
                        data-testid="@safety-checks-apply"
                    >
                        <Translation id="TR_CONFIRM" />
                    </NewModal.Button>
                    <NewModal.Button variant="tertiary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </NewModal.Button>
                </>
            }
        >
            <Banner icon>
                <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL_WARNING" />
            </Banner>
            <Card margin={{ top: spacings.md }}>
                <Column gap={spacings.xl} alignItems="flex-start">
                    <Radio
                        isChecked={level === 'Strict'}
                        onClick={() => setLevel('Strict')}
                        data-testid="@radio-button-strict"
                        verticalAlignment="center"
                    >
                        <Column alignItems="flex-start">
                            <Text typographyStyle="highlight">
                                <Translation id="TR_SAFETY_CHECKS_STRICT_LEVEL" />
                            </Text>
                            <Paragraph typographyStyle="hint">
                                <Translation id="TR_SAFETY_CHECKS_STRICT_LEVEL_DESC" />
                            </Paragraph>
                        </Column>
                    </Radio>
                    <Radio
                        // For the purpose of this modal consider `PromptAlways` as identical to `PromptTemporarily`.
                        isChecked={level === 'PromptTemporarily' || level === 'PromptAlways'}
                        onClick={() => setLevel('PromptTemporarily')}
                        data-testid="@radio-button-prompt"
                        verticalAlignment="center"
                    >
                        <Column alignItems="flex-start">
                            <Text typographyStyle="highlight">
                                <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL" />
                            </Text>
                            <Paragraph typographyStyle="hint">
                                <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL_DESC" />
                            </Paragraph>
                        </Column>
                    </Radio>
                </Column>
            </Card>
        </NewModal>
    );
};
