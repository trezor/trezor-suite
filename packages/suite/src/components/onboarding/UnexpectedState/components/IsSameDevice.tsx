import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Translation } from '@suite-components/Translation';

import { resetOnboarding } from '@suite/actions/onboarding/onboardingActions';
import { Text, Wrapper, OnboardingButton } from '@onboarding-components';

import { Dispatch } from '@suite-types';

import l10nMessages from './IsSameDevice.messages';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actionAlt: bindActionCreators(resetOnboarding, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const IsSameDevice = ({ actionAlt }: Props) => (
    <>
        <Text>
            <Translation>{l10nMessages.TR_DEVICE_YOU_RECONNECTED_IS_DIFFERENT}></Translation>
        </Text>
        <Text>--- or ---</Text>
        <Wrapper.Controls>
            <OnboardingButton.Alt onClick={actionAlt}>Start over</OnboardingButton.Alt>
        </Wrapper.Controls>
    </>
);

export default connect(
    null,
    mapDispatchToProps,
)(IsSameDevice);
