import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link, H2 } from '@trezor/components';

import { Translation } from '@suite-components';
import { SUPPORT_URL } from '@suite-constants/urls';
import * as STEP from '@onboarding-constants/steps';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as routerActions from '@suite-actions/routerActions';
import { Text, Wrapper, OnboardingButton } from '@onboarding-components';
import messages from '@suite/support/messages';
import { AppState, Dispatch } from '@suite-types';
import { resolveStaticPath } from '@suite-utils/nextjs';

const mapDispatchToProps = (dispatch: Dispatch) => ({
    actionAlt: bindActionCreators(onboardingActions.removePath, dispatch),
    closeModalApp: bindActionCreators(routerActions.closeModalApp, dispatch),
});

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

type Props = ReturnType<typeof mapDispatchToProps> & ReturnType<typeof mapStateToProps>;

const IsNotNewDevice = ({ actionAlt, closeModalApp, device }: Props) => {
    // should never happen
    if (!device || !device.features) return null;

    return (
        <>
            <H2>
                <Translation>{messages.TR_IS_NOT_NEW_DEVICE_HEADING}</Translation>
            </H2>
            <Text>
                <Translation>{messages.TR_IS_NOT_NEW_DEVICE}</Translation>
            </Text>
            <img alt="" src={resolveStaticPath('images/suite/uni-warning.svg')} />
            <Wrapper.Controls>
                <Link href={SUPPORT_URL}>
                    <OnboardingButton.Cta style={{ width: '100%' }}>
                        <Translation>{messages.TR_CONTACT_SUPPORT}</Translation>
                    </OnboardingButton.Cta>
                </Link>

                {device.mode !== 'initialize' && (
                    <OnboardingButton.Alt
                        onClick={() => closeModalApp()}
                        data-test="@onboarding/unexpected-state/go-to-suite-button"
                    >
                        Go to Suite
                    </OnboardingButton.Alt>
                )}
                {device.mode === 'initialize' && device.firmware !== 'none' && (
                    <OnboardingButton.Alt
                        onClick={() => actionAlt([STEP.PATH_NEW])}
                        data-test="@onboarding/unexpected-state/use-it-anyway-button"
                    >
                        Use it anyway
                    </OnboardingButton.Alt>
                )}
            </Wrapper.Controls>
        </>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(IsNotNewDevice);
