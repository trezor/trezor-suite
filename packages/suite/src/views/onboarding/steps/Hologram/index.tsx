import React from 'react';
import styled from 'styled-components';
import { Button, Link } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import {
    TREZOR_RESELLERS_URL,
    TREZOR_PACKAGING_URL,
    SUPPORT_URL,
} from '@suite/config/onboarding/urls';
import { MD } from '@suite/config/onboarding/breakpoints';

import Text from '@suite/components/onboarding/Text';
import l10nCommonMessages from '@suite/support/commonMessages';

import {
    StepWrapper,
    StepHeadingWrapper,
    StepBodyWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';
import { OnboardingActions, OnboardingReducer } from '@suite/types/onboarding/onboarding';
import { ConnectReducer } from '@suite/types/onboarding/connect';
import l10nMessages from './index.messages';
// import Hologram from './components/Hologram';

const HologramWrapper = styled.div`
    max-width: 500px;
    margin: 10px;

    @media only screen and (min-width: ${MD}px) {
        width: 70%;
    }
`;

interface Props {
    onboardingActions: OnboardingActions;
    activeSubStep: OnboardingReducer['activeSubStep'];
    model: number;
    device: ConnectReducer['device'];
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
                    <React.Fragment>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_HOLOGRAM_STEP_SUBHEADING} />
                        </Text>
                        <HologramWrapper>{/* <Hologram model={model} /> */}</HologramWrapper>
                        <ControlsWrapper>
                            {actualVersion && actualVersion !== model && (
                                <React.Fragment>
                                    <Button
                                        onClick={() => onboardingActions.goToPreviousStep()}
                                        isWhite
                                    >
                                        Go back and select correct device
                                    </Button>
                                </React.Fragment>
                            )}
                            {(!actualVersion || actualVersion === model) && (
                                <React.Fragment>
                                    <Button
                                        data-test="button-hologram-different"
                                        onClick={() =>
                                            onboardingActions.goToSubStep('hologram-different')
                                        }
                                        isWhite
                                    >
                                        <FormattedMessage
                                            {...l10nMessages.TR_HOLOGRAM_STEP_ACTION_NOT_OK}
                                        />
                                    </Button>
                                    <Button
                                        data-test="button-continue"
                                        onClick={() => onboardingActions.goToNextStep()}
                                    >
                                        <FormattedMessage
                                            {...l10nMessages.TR_HOLOGRAM_STEP_ACTION_OK}
                                        />
                                    </Button>
                                </React.Fragment>
                            )}
                        </ControlsWrapper>
                    </React.Fragment>
                )}
                {activeSubStep === 'hologram-different' && (
                    <React.Fragment>
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
                            <Button
                                isWhite
                                onClick={() => onboardingActions.goToSubStep(null)}
                                data-test="button-back"
                            >
                                Back
                            </Button>

                            <Link href={SUPPORT_URL} target="_self">
                                <Button
                                    data-test="button-contact-support"
                                    style={{ width: '100%' }}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTACT_SUPPORT} />
                                </Button>
                            </Link>
                        </ControlsWrapper>
                    </React.Fragment>
                )}
            </StepBodyWrapper>
        </StepWrapper>
    );
};

export default HologramStep;
