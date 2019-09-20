import React from 'react';
// import styled from 'styled-components';
import { injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
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
    // device: state.suite.device,
    deviceCall: state.onboarding.deviceCall,
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
    InjectedIntlProps;

const RecoveryStepModelT = (props: Props) => {
    const { deviceCall, connectActions } = props;

    const getStatus = () => {
        if (deviceCall.result && deviceCall.name === RECOVER_DEVICE) {
            return 'success';
        }
        if (
            deviceCall.error &&
            // todo: typescript
            // @ts-ignore
            deviceCall.error.code !== 'Failure_ActionCancelled' &&
            deviceCall.name === RECOVER_DEVICE
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
                                // @ts-ignore
                                values={{ error: deviceCall.error.code }}
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
                    <OnboardingButton.Back onClick={props.onboardingActions.goToPreviousStep}>
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
