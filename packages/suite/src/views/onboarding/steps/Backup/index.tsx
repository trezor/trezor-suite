import React from 'react';
import styled from 'styled-components';
import { Link } from '@trezor/components';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { Translation, Image } from '@suite-components';
import { PreBackupCheckboxes, AfterBackupCheckboxes } from '@backup-components';
import { canStart, canContinue } from '@backup-utils';
import { SEED_MANUAL_URL } from '@suite-constants/urls';

import { Props } from './Container';

const StyledImage = styled(Image)`
    flex: 1;
`;

const BackupStep = (props: Props) => {
    const { device, backup, locks } = props;

    if (!device || !device.features) {
        return null;
    }

    const { status } = backup;

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {status === 'initial' && <Translation id="TR_CREATE_BACKUP" />}
                {status === 'finished' && !backup.error && <Translation id="TR_BACKUP_CREATED" />}
                {status === 'finished' && backup.error && <Translation id="TOAST_BACKUP_FAILED" />}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {status === 'initial' && (
                    <>
                        <Text>
                            <Translation
                                id="TR_BACKUP_SUBHEADING_1"
                                values={{
                                    TR_SEED_MANUAL_LINK: (
                                        <Link href={SEED_MANUAL_URL}>
                                            <Translation id="TR_SEED_MANUAL_LINK" />
                                        </Link>
                                    ),
                                }}
                            />
                        </Text>

                        <PreBackupCheckboxes />

                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                data-test="@backup/start-button"
                                onClick={() => props.backupDevice()}
                                isDisabled={!canStart(backup.userConfirmed, locks)}
                            >
                                <Translation id="TR_START_BACKUP" />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}

                {status === 'finished' && backup.error && (
                    <>
                        <Text>
                            <Translation id="TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION" />
                        </Text>
                        <StyledImage image="UNI_ERROR" />
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => {
                                    props.goto('settings-index');
                                }}
                            >
                                <Translation id="TR_GO_TO_SETTINGS" />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}

                {status === 'finished' && !backup.error && (
                    <>
                        <Text>
                            <Translation id="TR_BACKUP_FINISHED_TEXT" />
                        </Text>

                        <AfterBackupCheckboxes />

                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                data-test="@backup/close-button"
                                onClick={() => props.goToNextStep()}
                                isDisabled={!canContinue(backup.userConfirmed)}
                            >
                                <Translation id="TR_BACKUP_FINISHED_BUTTON" />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                {status !== 'in-progress' && (
                    <OnboardingButton.Back
                        icon="CROSS"
                        data-test="@onboarding/exit-app-button"
                        onClick={() => props.closeModalApp()}
                    >
                        {status === 'finished' ? (
                            <Translation id="TR_SKIP_SECURITY_PIN" />
                        ) : (
                            <Translation id="TR_SKIP_SECURITY" />
                        )}
                    </OnboardingButton.Back>
                )}
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default BackupStep;
