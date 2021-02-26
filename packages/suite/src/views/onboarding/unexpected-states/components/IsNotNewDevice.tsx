import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { H2 } from '@trezor/components';
import { Translation, Image, TrezorLink } from '@suite-components';
import { SUPPORT_URL } from '@suite-constants/urls';
import * as STEP from '@onboarding-constants/steps';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as routerActions from '@suite-actions/routerActions';
import { Text, Wrapper, OnboardingButton } from '@onboarding-components';

import { AppState, Dispatch } from '@suite-types';

const StyledImage = styled(Image)`
    flex: 1;
`;

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            actionAlt: onboardingActions.removePath,
            closeModalApp: routerActions.closeModalApp,
        },
        dispatch,
    );

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
});

type Props = ReturnType<typeof mapDispatchToProps> & ReturnType<typeof mapStateToProps>;

const IsNotNewDevice = ({ actionAlt, closeModalApp, device }: Props) => {
    // should never happen
    if (!device || !device.features) return null;

    return (
        <Wrapper.Step>
            <Wrapper.StepBody>
                <H2>
                    <Translation id="TR_IS_NOT_NEW_DEVICE_HEADING" />
                </H2>
                <Text>
                    <Translation id="TR_IS_NOT_NEW_DEVICE" />
                </Text>
                <StyledImage image="UNI_WARNING" width="160" />
                <Wrapper.Controls>
                    <TrezorLink variant="nostyle" href={SUPPORT_URL}>
                        <OnboardingButton.Cta style={{ width: '100%' }}>
                            <Translation id="TR_CONTACT_SUPPORT" />
                        </OnboardingButton.Cta>
                    </TrezorLink>

                    {device.mode !== 'initialize' && (
                        <OnboardingButton.Alt
                            onClick={() => closeModalApp()}
                            data-test="@onboarding/unexpected-state/go-to-suite-button"
                        >
                            <Translation id="TR_GO_TO_SUITE" />
                        </OnboardingButton.Alt>
                    )}
                    {device.mode === 'initialize' && device.firmware !== 'none' && (
                        <OnboardingButton.Alt
                            onClick={() => actionAlt([STEP.PATH_NEW])}
                            data-test="@onboarding/unexpected-state/use-it-anyway-button"
                        >
                            <Translation id="TR_USE_IT_ANYWAY" />
                        </OnboardingButton.Alt>
                    )}
                </Wrapper.Controls>
            </Wrapper.StepBody>
        </Wrapper.Step>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(IsNotNewDevice);
