import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { H2, P } from '@trezor/components-v2';
import { Translation } from '@suite-components';
import { Wrapper, OnboardingButton } from '@onboarding-components';
import messages from '@suite/support/messages';
import * as suiteActions from '@suite-actions/suiteActions';
import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actionCta: bindActionCreators(suiteActions.acquireDevice, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const DeviceIsUsedHere = ({ actionCta }: Props) => (
    <>
        <H2>
            <Translation>{messages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_HEADING}</Translation>
        </H2>
        <P size="small">
            <Translation>{messages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_TEXT}</Translation>
        </P>
        <Wrapper.Controls>
            <OnboardingButton.Cta onClick={() => actionCta()}>
                <Translation>{messages.TR_DEVICE_IS_USED_IN_OTHER_WINDOW_BUTTON}</Translation>
            </OnboardingButton.Cta>
        </Wrapper.Controls>
    </>
);

export default connect(null, mapDispatchToProps)(DeviceIsUsedHere);
