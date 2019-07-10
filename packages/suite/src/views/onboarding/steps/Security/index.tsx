import React from 'react';
import { Button } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import { goToNextStep } from '@onboarding-actions/onboardingActions';
import { callActionAndGoToNextStep, resetDevice } from '@onboarding-actions/connectActions';

import * as STEP from '@suite/constants/onboarding/steps';
import Text from '@suite/components/onboarding/Text';
import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';

import l10nMessages from './index.messages';

interface Props {
    callActionAndGoToNextStep: typeof callActionAndGoToNextStep;
    goToNextStep: typeof goToNextStep;
    resetDevice: typeof resetDevice;
}

const SecurityStep = (props: Props) => (
    <StepWrapper>
        <StepHeadingWrapper>
            <FormattedMessage {...l10nMessages.TR_SECURITY_HEADING} />
        </StepHeadingWrapper>
        <StepBodyWrapper>
            <Text>
                <FormattedMessage {...l10nMessages.TR_SECURITY_SUBHEADING} />
            </Text>
            <ControlsWrapper>
                <Button
                    isWhite
                    onClick={() =>
                        props.callActionAndGoToNextStep(
                            () => props.resetDevice(),
                            STEP.ID_FINAL_STEP,
                        )
                    }
                >
                    <FormattedMessage {...l10nMessages.TR_SKIP_SECURITY} />
                </Button>
                <Button
                    onClick={() => {
                        props.callActionAndGoToNextStep(
                            () => props.resetDevice(),
                            STEP.ID_BACKUP_STEP,
                        );
                    }}
                >
                    <FormattedMessage {...l10nMessages.TR_GO_TO_SECURITY} />
                </Button>
            </ControlsWrapper>
        </StepBodyWrapper>
    </StepWrapper>
);

export default SecurityStep;
