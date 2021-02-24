import React from 'react';
import styled from 'styled-components';

import { Button, variables } from '@trezor/components';
import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import * as STEP from '@onboarding-constants/steps';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { Translation, Image, TrezorLink } from '@suite-components';
import { useActions, useSelector } from '@suite-hooks';
import { SUPPORT_URL, TREZOR_PACKAGING_URL, TREZOR_RESELLERS_URL } from '@suite-constants/urls';

import Hologram from './components/Hologram';

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

const HologramStep = () => {
    const { goToPreviousStep, goToNextStep, goToSubStep } = useActions({
        goToPreviousStep: onboardingActions.goToPreviousStep,
        goToNextStep: onboardingActions.goToNextStep,
        goToSubStep: onboardingActions.goToSubStep,
    });
    const { device, model, activeSubStep } = useSelector(state => ({
        device: state.suite.device,
        model: state.onboarding.selectedModel,
        activeSubStep: state.onboarding.activeSubStep,
    }));

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
                                onClick={() => goToSubStep('hologram-different')}
                            >
                                <Translation id="TR_HOLOGRAM_STEP_ACTION_NOT_OK" />
                            </OnboardingButton.Alt>
                            <OnboardingButton.Cta
                                data-test="@onboarding/hologram/continue-button"
                                onClick={() => goToNextStep()}
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
                                        <TrezorLink href={TREZOR_PACKAGING_URL}>
                                            <Translation id="TR_PACKAGING_LINK" />
                                        </TrezorLink>
                                    ),
                                    TR_RESELLERS_LINK: (
                                        <TrezorLink href={TREZOR_RESELLERS_URL}>
                                            <Translation id="TR_RESELLERS_LINK" />
                                        </TrezorLink>
                                    ),
                                    TR_CONTACT_OUR_SUPPORT_LINK: (
                                        <TrezorLink href={SUPPORT_URL}>
                                            <Translation id="TR_CONTACT_OUR_SUPPORT_LINK" />
                                        </TrezorLink>
                                    ),
                                }}
                            />
                        </Text>
                        <StyledImage image="UNI_WARNING" />

                        <Wrapper.Controls>
                            <OnboardingButton.Alt
                                onClick={() => goToSubStep(null)}
                                data-test="@onboarding/hologram/show-hologram-again-button"
                            >
                                <Translation id="TR_SHOW_HOLOGRAM_AGAIN" />
                            </OnboardingButton.Alt>

                            <TrezorLink variant="nostyle" href={SUPPORT_URL}>
                                <Button
                                    icon="EXTERNAL_LINK"
                                    alignIcon="right"
                                    data-test="@onboarding/hologram/contact-support-button"
                                    style={{ width: '100%' }}
                                >
                                    <Translation id="TR_CONTACT_SUPPORT" />
                                </Button>
                            </TrezorLink>
                        </Wrapper.Controls>
                    </>
                )}
            </Wrapper.StepBody>
            <Wrapper.StepFooter>
                <Wrapper.Controls>
                    <OnboardingButton.Back
                        onClick={() =>
                            goToPreviousStep(
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
