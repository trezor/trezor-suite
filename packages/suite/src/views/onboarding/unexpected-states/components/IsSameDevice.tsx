
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import styled from 'styled-components';

import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { Translation, Image } from '@suite-components';
import { Dispatch } from '@suite-types';
import { resetOnboarding } from '@onboarding-actions/onboardingActions';

const StyledImage = styled(Image)`
    flex: 1;
`;

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actionAlt: bindActionCreators(resetOnboarding, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const IsSameDevice = ({ actionAlt }: Props) => (
    <>
        <StyledImage image="UNI_WARNING" />
        <Text>
            <Translation id="TR_DEVICE_YOU_RECONNECTED_IS_DIFFERENT" />
        </Text>
        <Text>--- or ---</Text>
        <Wrapper.Controls>
            <OnboardingButton.Alt onClick={actionAlt}>Start over</OnboardingButton.Alt>
        </Wrapper.Controls>
    </>
);

export default connect(null, mapDispatchToProps)(IsSameDevice);
