import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import * as STEP from '@onboarding-constants/steps';
import { SUPPORT_URL, TREZOR_PACKAGING_URL, TREZOR_RESELLERS_URL } from '@suite-constants/urls';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { variables } from '@trezor/components';
import { Link } from '@trezor/components-v2';
import React from 'react';
import styled from 'styled-components';

import Hologram from './components/Hologram';
import { Props } from './Container';

const HologramWrapper = styled.div`
    max-width: 400px;
    margin: 10px;

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        width: 70%;
    }
`;

const HologramStep = ({ onboardingActions, activeSubStep, model, device }: Props) => {
    const actualModel =
        device && device.features && device.features.major_version
            ? device.features.major_version
            : null;
    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                <Translation {...messages.TR_HOLOGRAM_STEP_HEADING} />
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {activeSubStep !== 'hologram-different' && (
                    <>
                        <Text>
                            <Translation {...messages.TR_HOLOGRAM_STEP_SUBHEADING} />
                        </Text>
                        <HologramWrapper>
                            <Hologram model={model || actualModel || 2} />
                        </HologramWrapper>
                        <Wrapper.Controls>
                            <OnboardingButton.Alt
                                data-test="@onboarding/button-hologram-different"
                                onClick={() => onboardingActions.goToSubStep('hologram-different')}
                            >
                                <Translation {...messages.TR_HOLOGRAM_STEP_ACTION_NOT_OK} />
                            </OnboardingButton.Alt>
                            <OnboardingButton.Cta
                                data-test="@onboarding/continue-button"
                                onClick={() => onboardingActions.goToNextStep()}
                            >
                                <Translation {...messages.TR_HOLOGRAM_STEP_ACTION_OK} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
                {activeSubStep === 'hologram-different' && (
                    <>
                        <Text>
                            <Translation
                                {...messages.TR_DID_YOU_PURCHASE}
                                values={{
                                    TR_PACKAGING_LINK: (
                                        <Link href={TREZOR_PACKAGING_URL}>
                                            <Translation {...messages.TR_PACKAGING_LINK} />
                                        </Link>
                                    ),
                                    TR_RESELLERS_LINK: (
                                        <Link href={TREZOR_RESELLERS_URL}>
                                            <Translation {...messages.TR_RESELLERS_LINK} />
                                        </Link>
                                    ),
                                    TR_CONTACT_OUR_SUPPORT_LINK: (
                                        <Link href={SUPPORT_URL}>
                                            <Translation
                                                {...messages.TR_CONTACT_OUR_SUPPORT_LINK}
                                            />
                                        </Link>
                                    ),
                                }}
                            />
                        </Text>
                        <Wrapper.Controls>
                            <OnboardingButton.Alt
                                onClick={() => onboardingActions.goToSubStep(null)}
                                data-test="button-back"
                            >
                                Show hologram again
                            </OnboardingButton.Alt>

                            <Link href={SUPPORT_URL} target="_self">
                                <OnboardingButton.Cta
                                    data-test="button-contact-support"
                                    style={{ width: '100%' }}
                                >
                                    <Translation {...messages.TR_CONTACT_SUPPORT} />
                                </OnboardingButton.Cta>
                            </Link>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <Wrapper.Controls>
                    <OnboardingButton.Back
                        onClick={() =>
                            onboardingActions.goToPreviousStep(
                                actualModel ? STEP.ID_NEW_OR_USED : STEP.ID_SELECT_DEVICE_STEP,
                            )
                        }
                    >
                        <Translation {...messages.TR_BACK} />
                    </OnboardingButton.Back>
                </Wrapper.Controls>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default HologramStep;
