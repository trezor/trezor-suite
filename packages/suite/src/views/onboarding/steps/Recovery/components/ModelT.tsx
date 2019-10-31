import React from 'react';
// import styled from 'styled-components';
import { injectIntl, WrappedComponentProps, FormattedMessage } from 'react-intl';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { RECOVER_DEVICE } from '@onboarding-actions/constants/calls';

import l10nCommonMessages from '@suite-support/Messages';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as connectActions from '@onboarding-actions/connectActions';
import { Text, Wrapper, OnboardingButton } from '@onboarding-components';

import l10nMessages from './ModelT.messages';
import l10nRecoveryMessages from '../index.messages';

import { Dispatch, AppState } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    uiInteraction: state.onboarding.uiInteraction,
    deviceCall: state.onboarding.deviceCall,
    device: state.suite.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
        goToPreviousStep: bindActionCreators(onboardingActions.goToPreviousStep, dispatch),
    },
    connectActions: {
        recoveryDevice: bindActionCreators(connectActions.recoveryDevice, dispatch),
        resetCall: bindActionCreators(connectActions.resetCall, dispatch),
    },
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps;

const RecoveryStepModelT = (props: Props) => {
    const { deviceCall, device, uiInteraction, connectActions } = props;

    const getStatus = () => {
        // todo: legacy, older firmwares dont respond with ButtonRequest_Success
        // this could be deleted if we forbid user to continue without updating fw to the latest
        if (deviceCall.result && deviceCall.name === RECOVER_DEVICE) {
            return 'success';
        }
        if (uiInteraction.name === 'ButtonRequest_Success') {
            return 'success';
        }
        if (
            deviceCall.error &&
            deviceCall.error !== 'Cancelled' &&
            deviceCall.name === RECOVER_DEVICE &&
            // on model T, recovery is persistent. when devices reaches recovery_mode, disconnecting
            // does not mean failure.
            device &&
            device.features &&
            device.features.recovery_mode !== true
        ) {
            return 'error';
        }
        return null;
    };

    const recoveryDevice = () => {
        connectActions.recoveryDevice();
    };

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {getStatus() === null && 'Recover your device from seed'}
                {/* todo ? */}
                {getStatus() === 'success' && 'Device recovered from seed'}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {getStatus() === null && (
                    <>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_RECOVER_SUBHEADING_MODEL_T} />
                        </Text>
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => {
                                    recoveryDevice();
                                }}
                            >
                                <FormattedMessage {...l10nRecoveryMessages.TR_START_RECOVERY} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
                {getStatus() === 'success' && (
                    <Wrapper.Controls>
                        <OnboardingButton.Cta
                            onClick={() => props.onboardingActions.goToNextStep()}
                        >
                            Continue
                        </OnboardingButton.Cta>
                    </Wrapper.Controls>
                )}
                {getStatus() === 'error' && (
                    <>
                        <Text>
                            <FormattedMessage
                                {...l10nRecoveryMessages.TR_RECOVERY_ERROR}
                                values={{ error: deviceCall.error || '' }}
                            />
                        </Text>
                        <OnboardingButton.Cta
                            onClick={() => {
                                props.connectActions.resetCall();
                            }}
                        >
                            <FormattedMessage {...l10nCommonMessages.TR_RETRY} />
                        </OnboardingButton.Cta>
                    </>
                )}
            </Wrapper.StepBody>

            <Wrapper.StepFooter>
                {getStatus() == null && (
                    <OnboardingButton.Back
                        onClick={() => props.onboardingActions.goToPreviousStep()}
                    >
                        Back
                    </OnboardingButton.Back>
                )}
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default injectIntl(
    connect(
        mapStateToProps,
        mapDispatchToProps,
    )(RecoveryStepModelT),
);
