import React, { useState } from 'react';
import styled from 'styled-components';
import { Image } from '@trezor/components';

import {
    OnboardingButtonCta,
    OnboardingButtonSkip,
    OptionsWrapper,
    OnboardingStepBox,
    SkipStepConfirmation,
} from 'src/components/onboarding';
import { Translation } from 'src/components/suite';
import { BackupSeedCards } from 'src/components/backup';
import { canContinue } from 'src/utils/backup';
import { useSelector, useActions } from 'src/hooks/suite';
import * as onboardingActions from 'src/actions/onboarding/onboardingActions';
import * as backupActions from 'src/actions/backup/backupActions';
import * as routerActions from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';

const StyledImage = styled(Image)`
    flex: 1;
`;

export const BackupStep = () => {
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
    const { goToNextStep, backupDevice, goto, updateAnalytics } = useActions({
        goToNextStep: onboardingActions.goToNextStep,
        backupDevice: backupActions.backupDevice,
        goto: routerActions.goto,
        updateAnalytics: onboardingActions.updateAnalytics,
    });
    const { backup, locks, device } = useSelector(state => ({
        backup: state.backup,
        locks: state.suite.locks,
        device: state.suite.device,
    }));
    const deviceModelInternal = device?.features?.internal_model;
    const isActionAbortable = useSelector(selectIsActionAbortable);

    if (!deviceModelInternal) {
        return null;
    }

    return (
        <>
            {showSkipConfirmation && (
                <SkipStepConfirmation onCancel={() => setShowSkipConfirmation(false)} />
            )}
            {backup.status === 'initial' && (
                <OnboardingStepBox
                    key={backup.status} // to properly rerender in translation mode
                    image="BACKUP"
                    heading={<Translation id="TR_CREATE_BACKUP" />}
                    description={<Translation id="TR_BACKUP_SUBHEADING_1" />}
                    innerActions={
                        <OnboardingButtonCta
                            data-test="@backup/start-button"
                            onClick={() => {
                                updateAnalytics({ backup: 'create' });
                                backupDevice();
                            }}
                            isDisabled={!canContinue(backup.userConfirmed, locks)}
                        >
                            <Translation id="TR_START_BACKUP" />
                        </OnboardingButtonCta>
                    }
                    outerActions={
                        <OnboardingButtonSkip
                            data-test="@onboarding/exit-app-button"
                            onClick={() => {
                                updateAnalytics({ backup: 'skip' });
                                setShowSkipConfirmation(true);
                            }}
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
            {backup.status === 'in-progress' && (
                <OnboardingStepBox
                    key={backup.status} // to properly rerender in translation mode
                    image="BACKUP"
                    heading={<Translation id="TR_CREATE_BACKUP" />}
                    description={<Translation id="TR_BACKUP_SUBHEADING_1" />}
                    deviceModelInternal={deviceModelInternal}
                    isActionAbortable={isActionAbortable}
                />
            )}

            {backup.status === 'finished' && (
                <OnboardingStepBox
                    key={backup.status} // to properly rerender in translation mode
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
            {backup.status === 'error' && (
                <OnboardingStepBox
                    key={backup.status} // to properly rerender in translation mode
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
