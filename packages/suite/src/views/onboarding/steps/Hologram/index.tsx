import React from 'react';
import styled from 'styled-components';

import { Link, Button, variables } from '@trezor/components';
import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import * as STEP from '@onboarding-constants/steps';
import { SUPPORT_URL, TREZOR_PACKAGING_URL, TREZOR_RESELLERS_URL } from '@suite-constants/urls';
import { Translation, Image } from '@suite-components';

import Hologram from './components/Hologram';
import { Props } from './Container';

const StyledImage = styled(Image)`
    flex: 1;
`;

const HologramWrapper = styled.div`
    max-width: 400px;
    flex: 1;
    padding: 16px;

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
                {activeSubStep === 'hologram-different' ? (
                    <Translation id="TR_HOLOGRAM_STEP_HEADING_INTRO" />
                ) : (
                    <Translation id="TR_HOLOGRAM_STEP_HEADING" />
                )}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {activeSubStep !== 'hologram-different' && (
                    <>
                        <Text>
                            <Translation id="TR_HOLOGRAM_STEP_SUBHEADING" />
                        </Text>
                        <HologramWrapper>
                            <Hologram model={model || actualModel || 2} />
                        </HologramWrapper>
                        <Wrapper.Controls>
                            <OnboardingButton.Alt
                                data-test="@onboarding/hologram/hologram-different-button"
                                onClick={() => onboardingActions.goToSubStep('hologram-different')}
                            >
                                <Translation id="TR_HOLOGRAM_STEP_ACTION_NOT_OK" />
                            </OnboardingButton.Alt>
                            <OnboardingButton.Cta
                                data-test="@onboarding/hologram/continue-button"
                                onClick={() => onboardingActions.goToNextStep()}
                            >
                                <Translation id="TR_HOLOGRAM_STEP_ACTION_OK" />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
                {activeSubStep === 'hologram-different' && (
                    <>
                        <Text>
                            <Translation
                                id="TR_DID_YOU_PURCHASE"
                                values={{
                                    TR_PACKAGING_LINK: (
                                        <Link href={TREZOR_PACKAGING_URL}>
                                            <Translation id="TR_PACKAGING_LINK" />
                                        </Link>
                                    ),
                                    TR_RESELLERS_LINK: (
                                        <Link href={TREZOR_RESELLERS_URL}>
                                            <Translation id="TR_RESELLERS_LINK" />
                                        </Link>
                                    ),
                                    TR_CONTACT_OUR_SUPPORT_LINK: (
                                        <Link href={SUPPORT_URL}>
                                            <Translation id="TR_CONTACT_OUR_SUPPORT_LINK" />
                                        </Link>
                                    ),
                                }}
                            />
                        </Text>
                        <StyledImage image="UNI_WARNING" />

                        <Wrapper.Controls>
                            <OnboardingButton.Alt
                                onClick={() => onboardingActions.goToSubStep(null)}
                                data-test="@onboarding/hologram/show-hologram-again-button"
                            >
                                <Translation id="TR_SHOW_HOLOGRAM_AGAIN" />
                            </OnboardingButton.Alt>

                            <Link variant="nostyle" href={SUPPORT_URL}>
                                <Button
                                    icon="EXTERNAL_LINK"
                                    alignIcon="right"
                                    data-test="@onboarding/hologram/contact-support-button"
                                    style={{ width: '100%' }}
                                >
                                    <Translation id="TR_CONTACT_SUPPORT" />
                                </Button>
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
                        <Translation id="TR_BACK" />
                    </OnboardingButton.Back>
                </Wrapper.Controls>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default HologramStep;
