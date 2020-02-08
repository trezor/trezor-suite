import React from 'react';
import { Link, P } from '@trezor/components-v2';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { Translation } from '@suite-components';
import { PreBackupCheckboxes, AfterBackupCheckboxes } from '@backup-components';
import { canStart, canContinue } from '@backup-utils';
import { SEED_MANUAL_URL } from '@suite-constants/urls';
import messages from '@suite/support/messages';
import { Props } from './Container';

const BackupStep = (props: Props) => {
    const { device, backup } = props;

    if (!device || !device.features) {
        return null;
    }

    const { status } = backup;

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {status === 'initial' && 'Create a backup seed'}
                {status === 'finished' && !backup.error && 'Backup finished'}
                {status === 'finished' && backup.error && 'Backup failed'}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {status === 'initial' && (
                    <>
                        <Text>
                            <Translation
                                {...messages.TR_BACKUP_SUBHEADING_1}
                                values={{
                                    TR_SEED_MANUAL_LINK: (
                                        <Link href={SEED_MANUAL_URL}>
                                            <Translation {...messages.TR_SEED_MANUAL_LINK} />
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
                                isDisabled={!canStart(backup.userConfirmed)}
                            >
                                <Translation {...messages.TR_START_BACKUP} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}

                {status === 'finished' && backup.error && (
                    <>
                        <Text>
                            <Translation
                                {...messages.TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION}
                            />
                        </Text>

                        <P>Once you click retry, device will ask you to confirm these steps:</P>
                        <P>1. wipe device</P>
                        <P>2. create new wallet</P>
                        <P>3. start backup again</P>

                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => {
                                    props.retryBackup();
                                }}
                                isDisabled={!device || !device.connected}
                            >
                                <Translation {...messages.TR_RETRY} />
                            </OnboardingButton.Cta>
                            <OnboardingButton.Alt
                                onClick={() => {
                                    props.goto('wallet-index');
                                }}
                                isDisabled={!device || !device.connected}
                            >
                                Go to wallet
                            </OnboardingButton.Alt>
                        </Wrapper.Controls>
                    </>
                )}

                {status === 'finished' && !backup.error && (
                    <>
                        <Text>
                            <Translation {...messages.TR_BACKUP_FINISHED_TEXT} />
                        </Text>

                        <AfterBackupCheckboxes />

                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                data-test="@backup/close-button"
                                onClick={() => props.goToNextStep()}
                                isDisabled={!canContinue(backup.userConfirmed)}
                            >
                                <Translation {...messages.TR_BACKUP_FINISHED_BUTTON} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>
        </Wrapper.Step>
    );
};

export default BackupStep;
