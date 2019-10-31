import React from 'react';
import styled from 'styled-components';
import { Link, variables } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import {
    TREZOR_RESELLERS_URL,
    TREZOR_PACKAGING_URL,
    SUPPORT_URL,
} from '@onboarding-constants/urls';
import l10nCommonMessages from '@suite-support/Messages';
import * as STEP from '@onboarding-constants/steps';
import { Wrapper, Text, OnboardingButton } from '@onboarding-components';
import l10nMessages from './index.messages';
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
                <FormattedMessage {...l10nMessages.TR_HOLOGRAM_STEP_HEADING} />
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {activeSubStep !== 'hologram-different' && (
                    <>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_HOLOGRAM_STEP_SUBHEADING} />
                        </Text>
                        <HologramWrapper>
                            <Hologram model={model || actualModel || 2} />
                        </HologramWrapper>
                        <Wrapper.Controls>
                            <OnboardingButton.Alt
                                data-test="@onboarding/button-hologram-different"
                                onClick={() => onboardingActions.goToSubStep('hologram-different')}
                            >
                                <FormattedMessage
                                    {...l10nMessages.TR_HOLOGRAM_STEP_ACTION_NOT_OK}
                                />
                            </OnboardingButton.Alt>
                            <OnboardingButton.Cta
                                data-test="@onboarding/button-continue"
                                onClick={() => onboardingActions.goToNextStep()}
                            >
                                <FormattedMessage {...l10nMessages.TR_HOLOGRAM_STEP_ACTION_OK} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
                {activeSubStep === 'hologram-different' && (
                    <>
                        <Text>
                            <FormattedMessage
                                {...l10nMessages.TR_DID_YOU_PURCHASE}
                                values={{
                                    TR_PACKAGING_LINK: (
                                        <Link href={TREZOR_PACKAGING_URL} variant="nostyle">
                                            <FormattedMessage {...l10nMessages.TR_PACKAGING_LINK} />
                                        </Link>
                                    ),
                                    TR_RESELLERS_LINK: (
                                        <Link href={TREZOR_RESELLERS_URL} variant="nostyle">
                                            <FormattedMessage {...l10nMessages.TR_RESELLERS_LINK} />
                                        </Link>
                                    ),
                                    TR_CONTACT_OUR_SUPPORT_LINK: (
                                        <Link href={SUPPORT_URL} variant="nostyle">
                                            <FormattedMessage
                                                {...l10nMessages.TR_CONTACT_OUR_SUPPORT_LINK}
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
                                Back
                            </OnboardingButton.Alt>

                            <Link href={SUPPORT_URL} target="_self" variant="nostyle">
                                <OnboardingButton.Cta
                                    data-test="button-contact-support"
                                    style={{ width: '100%' }}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTACT_SUPPORT} />
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
                        <FormattedMessage {...l10nCommonMessages.TR_BACK} />
                    </OnboardingButton.Back>
                </Wrapper.Controls>
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default HologramStep;
