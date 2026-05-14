import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import {
    Banner,
    Card,
    Column,
    Modal,
    type ModalProps,
    Paragraph,
    Radio,
    Text,
} from '@trezor/components';
import { spacings } from '@trezor/theme';

import { applySettings } from 'src/actions/settings/deviceSettingsActions';
import { useDispatch } from 'src/hooks/suite';

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
            onCancel={onCancel}
            heading={<Translation id="TR_SAFETY_CHECKS_MODAL_TITLE" />}
            intent="warning"
            width={600}
            bottomContent={
                <>
                    <Modal.Button
                        onClick={confirm}
                        // Only allow confirming when the value will be changed.
                        isDisabled={isLocked() || level === device?.features?.safety_checks}
                        data-testid="@safety-checks-apply"
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onCancel}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <Banner icon description={<Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL_WARNING" />} />
            <Card margin={{ top: spacings.md }}>
                <Column gap={spacings.xl} alignItems="flex-start">
                    <Radio
                        isChecked={level === 'Strict'}
                        onChange={() => setLevel('Strict')}
                        data-testid="@radio-button-strict"
                        verticalAlignment="center"
                    >
                        <Column alignItems="flex-start">
                            <Text typographyStyle="body-md-strong">
                                <Translation id="TR_SAFETY_CHECKS_STRICT_LEVEL" />
                            </Text>
                            <Paragraph typographyStyle="body-sm">
                                <Translation id="TR_SAFETY_CHECKS_STRICT_LEVEL_DESC" />
                            </Paragraph>
                        </Column>
                    </Radio>
                    <Radio
                        // For the purpose of this modal consider `PromptAlways` as identical to `PromptTemporarily`.
                        isChecked={level === 'PromptTemporarily' || level === 'PromptAlways'}
                        onChange={() => setLevel('PromptTemporarily')}
                        data-testid="@radio-button-prompt"
                        verticalAlignment="center"
                    >
                        <Column alignItems="flex-start">
                            <Text typographyStyle="body-md-strong">
                                <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL" />
                            </Text>
                            <Paragraph typographyStyle="body-sm">
                                <Translation id="TR_SAFETY_CHECKS_PROMPT_LEVEL_DESC" />
                            </Paragraph>
                        </Column>
                    </Radio>
                </Column>
            </Card>
        </Modal>
    );
};
