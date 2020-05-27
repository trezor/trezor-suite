import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { Translation, Image } from '@suite-components';
import { Dispatch } from '@suite-types';
import * as onboardingActions from '@onboarding-actions/onboardingActions';

const StyledImage = styled(Image)`
    flex: 1;
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
    <>
        <StyledImage image="UNI_WARNING" />
        <Text>
            <Translation id="TR_DEVICE_YOU_RECONNECTED_IS_DIFFERENT" />
        </Text>
        <Text>--- or ---</Text>
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
    </>
);

export default connect(null, mapDispatchToProps)(IsSameDevice);
