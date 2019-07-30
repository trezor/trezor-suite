import React from 'react';
// import { FormattedMessage } from 'react-intl';

import { AppState } from '@suite-types/index';
import { goToNextStep } from '@onboarding-actions/onboardingActions';
import { callActionAndGoToNextStep, resetDevice } from '@onboarding-actions/connectActions';
import * as STEP from '@onboarding-constants/steps';
import Option from '@onboarding-components/Option';
import Text from '@onboarding-components/Text';
import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
    OptionsWrapper,
} from '@onboarding-components/Wrapper';
import { ButtonCta } from '@onboarding-components/Buttons';

// import l10nMessages from './index.messages';

interface Props {
    device: AppState['onboarding']['connect']['device'];
    goToNextStep: typeof goToNextStep;
    callActionAndGoToNextStep: typeof callActionAndGoToNextStep;
    resetDevice: typeof resetDevice;
}

// if (path.includes(STEP.PATH_CREATE)) {
//     return () => {
//
//     };
// }
// return () => onboardingActions.goToNextStep(STEP.ID_RECOVERY_STEP);

const ShamirStep = (props: Props) => {
    const getModel = () => {
        if (props.device.features.major_version === 1) {
            return 1;
        }
        return 2;
    };
    return (
        <StepWrapper>
            <StepHeadingWrapper>
                {getModel() === 1 && 'Almost there! Prepare to launch'}
                {getModel() === 2 && 'Seed type'}
                {/* <FormattedMessage {...l10nMessages.TR_SECURITY_HEADING} /> */}
            </StepHeadingWrapper>
            <StepBodyWrapper>
                <Text>
                    {getModel() === 1 && 'Just click the button and continue. What about TOS?'}
                    {getModel() === 2 &&
                        'You might chose either standart backup type or shamir backups'}
                    {/* <FormattedMessage {...l10nMessages.TR_SECURITY_SUBHEADING} /> */}
                </Text>

                {getModel() === 2 && (
                    <OptionsWrapper>
                        <Option
                            onClick={() =>
                                props.callActionAndGoToNextStep(
                                    () => props.resetDevice(),
                                    STEP.ID_SECURITY_STEP,
                                )
                            }
                        >
                            {/* <H6>Shamir backup</H6> */}
                            <Text>bla bla</Text>
                            {/* <ButtonCta
                        data-test="button-new-device"
                        onClick={() => {
                            props.onboardingActions.setPath([...props.path, STEP.PATH_NEW]);
                            props.onboardingActions.goToNextStep();
                        }}
                    >
                        New device
                    </ButtonCta> */}
                        </Option>

                        <Option
                            onClick={() =>
                                props.callActionAndGoToNextStep(
                                    () => props.resetDevice(),
                                    STEP.ID_SECURITY_STEP,
                                )
                            }
                        >
                            <Text>bla bla</Text>
                        </Option>
                    </OptionsWrapper>
                )}
                {getModel() === 1 && (
                    <ControlsWrapper>
                        <ButtonCta
                            onClick={() =>
                                props.callActionAndGoToNextStep(
                                    () => props.resetDevice(),
                                    STEP.ID_SECURITY_STEP,
                                )
                            }
                        >
                            Create the f* wallet
                        </ButtonCta>
                    </ControlsWrapper>
                )}
            </StepBodyWrapper>
        </StepWrapper>
    );
};

export default ShamirStep;
