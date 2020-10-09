import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { Translation, Image } from '@suite-components';
import { Dispatch } from '@suite-types';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

const StyledImage = styled(Image)`
    margin: 20px;
`;

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            resetOnboarding: onboardingActions.resetOnboarding,
            enableOnboardingReducer: onboardingActions.enableOnboardingReducer,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapDispatchToProps>;

const IsSameDevice = ({ resetOnboarding, enableOnboardingReducer }: Props) => (
    <Wrapper.Step>
        <Wrapper.StepBody>
            <StyledImage image="UNI_WARNING" />

            <Wrapper.StepHeading>
                <Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_HEADING" />
            </Wrapper.StepHeading>

            <Text>
                <Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_P1" />
            </Text>
            <Text>
                <Translation id="ONBOARDING_UNEXPECTED_DEVICE_DIFFERENT_P2" />
            </Text>
            <Wrapper.Controls>
                <OnboardingButton.Alt
                    onClick={() => {
                        resetOnboarding();
                        enableOnboardingReducer(true);
                    }}
                    data-test="@onboarding/unexpected-state/is-same/start-over-button"
                >
                    <Translation id="TR_START_AGAIN" />
                </OnboardingButton.Alt>
            </Wrapper.Controls>
        </Wrapper.StepBody>
    </Wrapper.Step>
);

export default connect(null, mapDispatchToProps)(IsSameDevice);
