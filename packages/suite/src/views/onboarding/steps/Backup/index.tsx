import React, { useState } from 'react';
import styled from 'styled-components';
import {
    OnboardingButtonCta,
    OnboardingButtonSkip,
    OptionsWrapper,
    OnboardingStepBox,
    SkipStepConfirmation,
} from '@onboarding-components';
import { Translation, Image, TrezorLink } from '@suite-components';
import { BackupSeedCards } from '@backup-components';
import { canContinue } from '@backup-utils';
import { useSelector, useActions } from '@suite-hooks';
import { SEED_MANUAL_URL } from '@suite-constants/urls';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as backupActions from '@backup-actions/backupActions';
import * as routerActions from '@suite-actions/routerActions';
import { SettingsAnchor } from '@suite-constants/anchors';

const StyledImage = styled(Image)`
    flex: 1;
`;

const BackupStep = () => {
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
    const { goToNextStep, backupDevice, goto } = useActions({
        goToNextStep: onboardingActions.goToNextStep,
        backupDevice: backupActions.backupDevice,
        goto: routerActions.goto,
    });
    const { device, backup, locks } = useSelector(state => ({
        device: state.suite.device,
        backup: state.backup,
        locks: state.suite.locks,
    }));

    if (!device || !device.features) {
        return null;
    }

    const { status } = backup;

    return (
        <>
            {showSkipConfirmation && (
                <SkipStepConfirmation
                    onCancel={() => setShowSkipConfirmation(false)}
                    variant="backup"
                />
            )}
            {status === 'initial' && (
                <OnboardingStepBox
                    image="BACKUP"
                    heading={<Translation id="TR_CREATE_BACKUP" />}
                    description={
                        <Translation
                            id="TR_BACKUP_SUBHEADING_1"
                            values={{
                                TR_SEED_MANUAL_LINK: (
                                    <TrezorLink href={SEED_MANUAL_URL}>
                                        <Translation id="TR_SEED_MANUAL_LINK" />
                                    </TrezorLink>
                                ),
                            }}
                        />
                    }
                    innerActions={
                        <OnboardingButtonCta
                            data-test="@backup/start-button"
                            onClick={() => backupDevice()}
                            isDisabled={!canContinue(backup.userConfirmed, locks)}
                        >
                            <Translation id="TR_START_BACKUP" />
                        </OnboardingButtonCta>
                    }
                    outerActions={
                        <OnboardingButtonSkip
                            data-test="@onboarding/exit-app-button"
                            onClick={() => setShowSkipConfirmation(true)}
                        >
                            <Translation id="TR_SKIP_BACKUP" />
                        </OnboardingButtonSkip>
                    }
                >
                    <OptionsWrapper>
                        <BackupSeedCards />
                    </OptionsWrapper>
                </OnboardingStepBox>
            )}
            {status === 'in-progress' && (
                <OnboardingStepBox
                    image="BACKUP"
                    heading={<Translation id="TR_CREATE_BACKUP" />}
                    description={
                        <Translation
                            id="TR_BACKUP_SUBHEADING_1"
                            values={{
                                TR_SEED_MANUAL_LINK: (
                                    <TrezorLink href={SEED_MANUAL_URL}>
                                        <Translation id="TR_SEED_MANUAL_LINK" />
                                    </TrezorLink>
                                ),
                            }}
                        />
                    }
                    confirmOnDevice={device.features.major_version}
                />
            )}

            {status === 'finished' && !backup.error && (
                <OnboardingStepBox
                    image="BACKUP"
                    heading={<Translation id="TR_BACKUP_CREATED" />}
                    description={<Translation id="TR_BACKUP_FINISHED_TEXT" />}
                    innerActions={
                        <OnboardingButtonCta
                            data-test="@backup/close-button"
                            onClick={() => goToNextStep()}
                            isDisabled={!canContinue(backup.userConfirmed)}
                        >
                            <Translation id="TR_BACKUP_FINISHED_BUTTON" />
                        </OnboardingButtonCta>
                    }
                />
            )}
            {status === 'finished' && backup.error && (
                <OnboardingStepBox
                    image="BACKUP"
                    heading={<Translation id="TOAST_BACKUP_FAILED" />}
                    description={
                        <Translation id="TR_DEVICE_DISCONNECTED_DURING_ACTION_DESCRIPTION" />
                    }
                    innerActions={
                        <OnboardingButtonCta
                            onClick={() => {
                                goto('settings-device', { anchor: SettingsAnchor.WipeDevice });
                            }}
                        >
                            <Translation id="TR_GO_TO_SETTINGS" />
                        </OnboardingButtonCta>
                    }
                >
                    <OptionsWrapper fullWidth={false}>
                        <StyledImage image="UNI_ERROR" />
                    </OptionsWrapper>
                </OnboardingStepBox>
            )}
        </>
    );
};

export default BackupStep;
