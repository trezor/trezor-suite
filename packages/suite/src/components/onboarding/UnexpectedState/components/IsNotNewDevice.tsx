import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from '@trezor/components-v2';

import { Translation } from '@suite-components/Translation';
import { SUPPORT_URL } from '@onboarding-constants/urls';
import * as STEP from '@onboarding-constants/steps';
import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import { Text, Wrapper, OnboardingButton } from '@onboarding-components';
import messages from '@suite/support/messages';

import { Dispatch } from '@suite-types';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actionAlt: bindActionCreators(onboardingActions.removePath, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const IsNotNewDevice = ({ actionAlt }: Props) => (
    <>
        <Text>
            <Translation>{messages.TR_IS_NOT_NEW_DEVICE}</Translation>
        </Text>
        <Wrapper.Controls>
            <Link href={SUPPORT_URL}>
                <OnboardingButton.Cta style={{ width: '100%' }}>
                    <Translation>{messages.TR_CONTACT_SUPPORT}</Translation>
                </OnboardingButton.Cta>
            </Link>
            <OnboardingButton.Alt
                onClick={() => actionAlt([STEP.PATH_NEW])}
                data-test="@onboarding/unexpected-state/use-it-anyway-button"
            >
                Use it anyway
            </OnboardingButton.Alt>
        </Wrapper.Controls>
    </>
);

export default connect(null, mapDispatchToProps)(IsNotNewDevice);
