import React from 'react';
import styled from 'styled-components';
import { Link, variables } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import {
    TREZOR_RESELLERS_URL,
    TREZOR_PACKAGING_URL,
    SUPPORT_URL,
} from '@onboarding-constants/urls';
import Text from '@onboarding-components/Text';
import { ButtonBack, ButtonAlt, ButtonCta } from '@suite/components/onboarding/Buttons';
import l10nCommonMessages from '@suite-support/Messages';

import {
    StepWrapper,
    StepHeadingWrapper,
    StepBodyWrapper,
    StepFooterWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';

import { goToPreviousStep, goToNextStep, goToSubStep } from '@onboarding-actions/onboardingActions';
import l10nMessages from './index.messages';
import Hologram from './components/Hologram';
import { AppState } from '@suite-types';

const HologramWrapper = styled.div`
    max-width: 400px;
    margin: 10px;

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        width: 70%;
    }
`;

interface Props {
    onboardingActions: {
        goToPreviousStep: typeof goToPreviousStep;
        goToNextStep: typeof goToNextStep;
        goToSubStep: typeof goToSubStep;
    };
    activeSubStep: AppState['onboarding']['activeSubStep'];
    model: AppState['onboarding']['selectedModel'];
    device: AppState['onboarding']['connect']['device'];
}

const HologramStep = ({ onboardingActions, activeSubStep, model, device }: Props) => {
    const actualVersion =
        device && device.features && device.features.major_version
            ? device.features.major_version
            : null;
    return (
        <StepWrapper>
            <StepHeadingWrapper>
                <FormattedMessage {...l10nMessages.TR_HOLOGRAM_STEP_HEADING} />
            </StepHeadingWrapper>
            <StepBodyWrapper>
                {activeSubStep !== 'hologram-different' && (
                    <>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_HOLOGRAM_STEP_SUBHEADING} />
                        </Text>
                        <HologramWrapper>{model && <Hologram model={model} />}</HologramWrapper>
                        <ControlsWrapper>
                            {actualVersion && actualVersion !== model && (
                                <ButtonCta onClick={() => onboardingActions.goToPreviousStep()}>
                                    Go back and select correct device
                                </ButtonCta>
                            )}
                            {(!actualVersion || actualVersion === model) && (
                                <React.Fragment>
                                    <ButtonAlt
                                        data-test="button-hologram-different"
                                        onClick={() =>
                                            onboardingActions.goToSubStep('hologram-different')
                                        }
                                    >
                                        <FormattedMessage
                                            {...l10nMessages.TR_HOLOGRAM_STEP_ACTION_NOT_OK}
                                        />
                                    </ButtonAlt>
                                    <ButtonCta
                                        data-test="button-continue"
                                        onClick={() => onboardingActions.goToNextStep()}
                                    >
                                        <FormattedMessage
                                            {...l10nMessages.TR_HOLOGRAM_STEP_ACTION_OK}
                                        />
                                    </ButtonCta>
                                </React.Fragment>
                            )}
                        </ControlsWrapper>
                    </>
                )}
                {activeSubStep === 'hologram-different' && (
                    <>
                        <Text>
                            <FormattedMessage
                                {...l10nMessages.TR_DID_YOU_PURCHASE}
                                values={{
                                    TR_PACKAGING_LINK: (
                                        <Link href={TREZOR_PACKAGING_URL}>
                                            <FormattedMessage {...l10nMessages.TR_PACKAGING_LINK} />
                                        </Link>
                                    ),
                                    TR_RESELLERS_LINK: (
                                        <Link href={TREZOR_RESELLERS_URL}>
                                            <FormattedMessage {...l10nMessages.TR_RESELLERS_LINK} />
                                        </Link>
                                    ),
                                    TR_CONTACT_OUR_SUPPORT_LINK: (
                                        <Link href={SUPPORT_URL}>
                                            <FormattedMessage
                                                {...l10nMessages.TR_CONTACT_OUR_SUPPORT_LINK}
                                            />
                                        </Link>
                                    ),
                                }}
                            />
                        </Text>
                        <ControlsWrapper>
                            <ButtonAlt
                                onClick={() => onboardingActions.goToSubStep(null)}
                                data-test="button-back"
                            >
                                Back
                            </ButtonAlt>

                            <Link href={SUPPORT_URL} target="_self">
                                <ButtonCta
                                    data-test="button-contact-support"
                                    style={{ width: '100%' }}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTACT_SUPPORT} />
                                </ButtonCta>
                            </Link>
                        </ControlsWrapper>
                    </>
                )}
            </StepBodyWrapper>
            <StepFooterWrapper>
                <ControlsWrapper>
                    <ButtonBack onClick={() => onboardingActions.goToPreviousStep()}>
                        Back to Trezor model selection
                    </ButtonBack>
                </ControlsWrapper>
            </StepFooterWrapper>
        </StepWrapper>
    );
};

export default HologramStep;
