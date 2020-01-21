import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as recoveryActions from '@settings-actions/recoveryActions';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import { Translation } from '@suite-components';
import { AppState, Dispatch, InjectedModalApplicationProps } from '@suite-types';
import messages from '@suite/support/messages';

// import styled from 'styled-components';
const mapStateToProps = (state: AppState) => ({
    uiInteraction: state.onboarding.uiInteraction,
    device: state.suite.device,
    recovery: state.settings.recovery,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    goToPreviousStep: bindActionCreators(onboardingActions.goToPreviousStep, dispatch),
    recoverDevice: bindActionCreators(recoveryActions.recoverDevice, dispatch),
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps &
    InjectedModalApplicationProps;

const RecoveryStepModelT = (props: Props) => {
    const { device, uiInteraction, modal, recovery, recoverDevice } = props;

    const getStatus = () => {
        if (recovery.success) {
            return 'success';
        }
        // todo: reconsider, this might not be complete
        // todo: legacy, older firmwares dont respond with ButtonRequest_Success
        // this could be deleted if we forbid user to continue without updating fw to the latest
        if (uiInteraction.name === 'ButtonRequest_Success') {
            return 'success';
        }
        if (
            recovery.error &&
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

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {getStatus() === null && 'Recover your device from seed'}
                {getStatus() === 'success' && 'Device recovered from seed'}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {modal && modal}
                {!modal && (
                    <>
                        {getStatus() === null && (
                            <>
                                <Text>
                                    <Translation {...messages.TR_RECOVER_SUBHEADING_MODEL_T} />
                                </Text>
                                <Wrapper.Controls>
                                    <OnboardingButton.Cta
                                        onClick={() => {
                                            recoverDevice();
                                        }}
                                    >
                                        <Translation {...messages.TR_START_RECOVERY} />
                                    </OnboardingButton.Cta>
                                </Wrapper.Controls>
                            </>
                        )}
                        {getStatus() === 'success' && (
                            <Wrapper.Controls>
                                <OnboardingButton.Cta onClick={() => props.goToNextStep()}>
                                    Continue
                                </OnboardingButton.Cta>
                            </Wrapper.Controls>
                        )}
                        {getStatus() === 'error' && (
                            <>
                                <Text>
                                    <Translation
                                        {...messages.TR_RECOVERY_ERROR}
                                        values={{ error: recovery.error || '' }}
                                    />
                                </Text>
                                <OnboardingButton.Cta
                                    onClick={() => {
                                        console.log('todo');
                                    }}
                                >
                                    <Translation {...messages.TR_RETRY} />
                                </OnboardingButton.Cta>
                            </>
                        )}
                    </>
                )}
            </Wrapper.StepBody>

            <Wrapper.StepFooter>
                {getStatus() == null && (
                    <OnboardingButton.Back onClick={() => props.goToPreviousStep()}>
                        Back
                    </OnboardingButton.Back>
                )}
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(RecoveryStepModelT));
