import React from 'react';
// import { FormattedMessage } from 'react-intl';

import { AppState } from '@suite-types/index';
import { goToNextStep } from '@onboarding-actions/onboardingActions';
import { callActionAndGoToNextStep, resetDevice } from '@onboarding-actions/connectActions';
import * as STEP from '@onboarding-constants/steps';
import { Wrapper, Text, Option, OnboardingButton } from '@onboarding-components';

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
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {getModel() === 1 && 'Almost there! Prepare to launch'}
                {getModel() === 2 && 'Seed type'}
                {/* <FormattedMessage {...l10nMessages.TR_SECURITY_HEADING} /> */}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                <Text>
                    {getModel() === 1 && 'Just click the button and continue. What about TOS?'}
                    {getModel() === 2 &&
                        'You might chose either standart backup type or shamir backups'}
                    {/* <FormattedMessage {...l10nMessages.TR_SECURITY_SUBHEADING} /> */}
                </Text>

                {getModel() === 2 && (
                    <Wrapper.Options>
                        <Option
                            onClick={() =>
                                props.callActionAndGoToNextStep(
                                    () => props.resetDevice({ backupType: 0 }),
                                    STEP.ID_SECURITY_STEP,
                                )
                            }
                        >
                            <Text>Standard backup</Text>
                            {/* <OnboardingButton.Cta
                        data-test="button-new-device"
                        onClick={() => {
                            props.onboardingActions.setPath([...props.path, STEP.PATH_NEW]);
                            props.onboardingActions.goToNextStep();
                        }}
                    >
                        New device
                    </OnboardingButton.Cta> */}
                        </Option>

                        <Option
                            onClick={() =>
                                props.callActionAndGoToNextStep(
                                    () => props.resetDevice({ backupType: 1 }),
                                    STEP.ID_SECURITY_STEP,
                                )
                            }
                        >
                            <Text>Shamir backup (experimental)</Text>
                        </Option>
                    </Wrapper.Options>
                )}
                {getModel() === 1 && (
                    <Wrapper.Controls>
                        <OnboardingButton.Cta
                            onClick={() =>
                                props.callActionAndGoToNextStep(
                                    () => props.resetDevice(),
                                    STEP.ID_SECURITY_STEP,
                                )
                            }
                        >
                            Create the wallet
                        </OnboardingButton.Cta>
                    </Wrapper.Controls>
                )}
            </Wrapper.StepBody>
        </Wrapper.Step>
    );
};

export default ShamirStep;
