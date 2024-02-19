import { useState } from 'react';

import styled from 'styled-components';

import { Image } from '@trezor/components';
import { selectDevice } from '@suite-common/wallet-core';

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
import { useDispatch, useSelector } from 'src/hooks/suite';
import { goToNextStep, updateAnalytics } from 'src/actions/onboarding/onboardingActions';
import { backupDevice } from 'src/actions/backup/backupActions';
import { goto } from 'src/actions/suite/routerActions';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import * as onboardingActions from 'src/actions/onboarding/onboardingActions';

const StyledImage = styled(Image)`
    flex: 1;
`;

export const BackupStep = () => {
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);
    const backup = useSelector(state => state.backup);
    const device = useSelector(selectDevice);
    const locks = useSelector(state => state.suite.locks);
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const dispatch = useDispatch();

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
                            data-test-id="@backup/start-button"
                            onClick={() => {
                                dispatch(updateAnalytics({ backup: 'create' }));
                                dispatch(backupDevice({}, true));
                            }}
                            isDisabled={!canContinue(backup.userConfirmed, locks)}
                        >
                            <Translation id="TR_START_BACKUP" />
                        </OnboardingButtonCta>
                    }
                    outerActions={
                        <OnboardingButtonSkip
                            data-test-id="@onboarding/exit-app-button"
                            onClick={() => {
                                dispatch(updateAnalytics({ backup: 'skip' }));
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
                    device={device}
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
                            data-test-id="@backup/close-button"
                            onClick={() => dispatch(goToNextStep())}
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
                                dispatch(onboardingActions.resetOnboarding());
                                dispatch(
                                    goto('settings-device', { anchor: SettingsAnchor.WipeDevice }),
                                );
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
