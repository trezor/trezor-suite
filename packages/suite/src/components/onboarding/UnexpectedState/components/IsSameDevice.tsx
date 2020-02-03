import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { Translation } from '@suite-components';
import { Dispatch } from '@suite-types';
import { resetOnboarding } from '@onboarding-actions/onboardingActions';
import messages from '@suite/support/messages';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actionAlt: bindActionCreators(resetOnboarding, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const IsSameDevice = ({ actionAlt }: Props) => (
    <>
        <Text>
            <Translation>{messages.TR_DEVICE_YOU_RECONNECTED_IS_DIFFERENT}></Translation>
        </Text>
        <Text>--- or ---</Text>
        <Wrapper.Controls>
            <OnboardingButton.Alt onClick={actionAlt}>Start over</OnboardingButton.Alt>
        </Wrapper.Controls>
    </>
);

export default connect(null, mapDispatchToProps)(IsSameDevice);
