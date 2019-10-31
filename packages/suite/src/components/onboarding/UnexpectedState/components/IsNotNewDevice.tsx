import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from '@trezor/components';

import { Translation } from '@suite-components/Intl';
import { SUPPORT_URL } from '@onboarding-constants/urls';
import * as STEP from '@onboarding-constants/steps';
import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import { Text, Wrapper, OnboardingButton } from '@onboarding-components';

import { Dispatch } from '@suite-types';
import l10nCommonMessages from '@suite-support/Messages';

import l10nMessages from './IsNotNewDevice.messages';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actionAlt: bindActionCreators(onboardingActions.removePath, dispatch),
});

type Props = ReturnType<typeof mapDispatchToProps>;

const IsNotNewDevice = ({ actionAlt }: Props) => (
    <>
        <Text>
            <Translation>{l10nMessages.TR_IS_NOT_NEW_DEVICE}</Translation>
        </Text>
        <Wrapper.Controls>
            <Link href={SUPPORT_URL} variant="nostyle">
                <OnboardingButton.Cta style={{ width: '100%' }}>
                    <Translation>{l10nCommonMessages.TR_CONTACT_SUPPORT}</Translation>
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

export default connect(
    null,
    mapDispatchToProps,
)(IsNotNewDevice);
