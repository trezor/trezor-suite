import React from 'react';
import { P, Button } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import Text from '@suite/components/onboarding/Text';

import { OptionsList } from '@suite/components/onboarding/Options';
import * as STEP from '@suite/constants/onboarding/steps';
import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';
import { State } from '@suite/types/suite';
import { OnboardingActions } from '@suite/types/onboarding/onboarding';
import { ConnectActions } from '@suite/types/onboarding/connect';
import { RecoveryActions } from '@suite/types/onboarding/recovery';
import Recovery from './components/Recovery';
import CreateImg from './images/create-2.svg';
import RecoverImg from './images/recover-2.svg';

import l10nMessages from './index.messages';

const StartOption = () => (
    <React.Fragment>
        <P>
            <FormattedMessage {...l10nMessages.TR_START_FROM_SCRATCH} />
        </P>
        <img src={CreateImg} alt="start from scratch" />
    </React.Fragment>
);

const RecoverOption = () => (
    <React.Fragment>
        <P>
            <FormattedMessage {...l10nMessages.TR_RECOVER} />
        </P>
        <img src={RecoverImg} alt="recover device from seed" />
    </React.Fragment>
);

interface Props {
    asNewDevice: boolean;
    isResolved: boolean;
    activeSubStep: State['onboarding']['activeSubStep'];
    recovery: State['onboarding']['recovery'];
    device: State['suite']['device'];
    uiInteraction: State['onboarding']['connect']['uiInteraction'];
    deviceCall: State['onboarding']['connect']['deviceCall'];
    recoveryActions: RecoveryActions;
    onboardingActions: OnboardingActions;
    connectActions: ConnectActions;
}

const StartStep = ({
    asNewDevice,
    isResolved,
    onboardingActions,
    activeSubStep,
    recoveryActions,
    connectActions,
    recovery,
    device,
    uiInteraction,
    deviceCall,
}: Props) => (
    <StepWrapper>
        <StepHeadingWrapper>
            {activeSubStep === null && <FormattedMessage {...l10nMessages.TR_START_HEADING} />}
            {activeSubStep === STEP.ID_RECOVERY_STEP && (
                <FormattedMessage {...l10nMessages.TR_RECOVERY_HEADING} />
            )}
        </StepHeadingWrapper>
        <StepBodyWrapper>
            {/* todo: reconsider isResolved logic */}
            {!isResolved && activeSubStep === STEP.ID_RECOVERY_STEP && (
                <Recovery
                    onboardingActions={onboardingActions}
                    recoveryActions={recoveryActions}
                    connectActions={connectActions}
                    recovery={recovery}
                    device={device}
                    uiInteraction={uiInteraction}
                    deviceCall={deviceCall}
                />
            )}

            <Text>
                <FormattedMessage {...l10nMessages.TR_START_TEXT} />
            </Text>
            {/* <OptionsList
                        options={[
                            {
                                content: <StartOption />,
                                value: STEP.ID_SECURITY_STEP,
                                key: 1,
                                onClick: () => {
                                    onboardingActions.goToNextStep();
                                },
                            },
                            {
                                content: <RecoverOption />,
                                value: STEP.ID_RECOVERY_STEP,
                                key: 2,
                                onClick: () => {
                                    onboardingActions.goToNextStep();
                                },
                            },
                        ]}
                        selected={null}
                        selectedAccessor="value"
                    /> */}
            <ControlsWrapper isVertical>
                <Button onClick={() => onboardingActions.goToNextStep()}>
                    Create new Wallet <br />
                    if you never had any Wallet
                </Button>
                <Button onClick={() => onboardingActions.goToNextStep()} isWhite>
                    Restore existing wallet <br />
                    using your backup seed
                </Button>
            </ControlsWrapper>
        </StepBodyWrapper>
    </StepWrapper>
);

export default StartStep;
