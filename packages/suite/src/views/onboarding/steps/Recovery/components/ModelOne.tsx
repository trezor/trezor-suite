import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as recoveryActions from '@settings-actions/recoveryActions';
import { OnboardingButton, Option, Text, Wrapper } from '@onboarding-components';
import { RECOVERY_MODEL_ONE_URL } from '@suite-constants/urls';
import { Translation } from '@suite-components';
import { AppState, Dispatch } from '@suite-types';
import messages from '@suite/support/messages';
import { Link } from '@trezor/components-v2';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    deviceCall: state.onboarding.deviceCall,
    recovery: state.settings.recovery,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
    goToPreviousStep: bindActionCreators(onboardingActions.goToPreviousStep, dispatch),
    setWordsCount: bindActionCreators(recoveryActions.setWordsCount, dispatch),
    setAdvancedRecovery: bindActionCreators(recoveryActions.setAdvancedRecovery, dispatch),
    recoverDevice: bindActionCreators(recoveryActions.recoverDevice, dispatch),
});

type Props = { modal: React.ReactNode } & ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps>;

type Status = null | 'select-advanced-recovery';

const RecoveryStepModelOne = (props: Props) => {
    const [status, setStatus] = useState<Status>(null);

    const {
        goToNextStep,
        goToPreviousStep,
        setWordsCount,
        setAdvancedRecovery,
        recoverDevice,
        recovery,
        device,
        deviceCall,
        modal,
    } = props;

    if (!device || !device.features) {
        return null;
    }

    const getStatus = () => {
        if (recovery.success) {
            return 'success';
        }
        if (recovery.error) {
            return 'error';
        }
        if (modal) {
            return 'recovering';
        }
        return status;
    };

    return (
        <Wrapper.Step>
            <Wrapper.StepHeading>
                {getStatus() === null && 'Recover your device from seed'}
                {getStatus() === 'recovering' && 'Entering seedwords'}
                {getStatus() === 'select-advanced-recovery' && 'Select recovery method'}
                {getStatus() === 'success' && 'Device recovered from seed'}
                {getStatus() === 'error' && 'Recovery failed'}
            </Wrapper.StepHeading>
            <Wrapper.StepBody>
                {modal && modal}

                {!modal && (
                    <>
                        {getStatus() === null && (
                            <>
                                <Text>
                                    <Translation {...messages.TR_RECOVER_SUBHEADING} />
                                </Text>
                                <Wrapper.Options>
                                    <Option
                                        action={() => {
                                            setWordsCount(12);
                                            setStatus('select-advanced-recovery');
                                        }}
                                        title="??"
                                        text={
                                            <Translation
                                                {...messages.TR_WORDS}
                                                values={{ count: '12' }}
                                            />
                                        }
                                        button="???"
                                    />
                                    <Option
                                        action={() => {
                                            setWordsCount(18);
                                            setStatus('select-advanced-recovery');
                                        }}
                                        title="??"
                                        text={
                                            <Translation
                                                {...messages.TR_WORDS}
                                                values={{ count: '18' }}
                                            />
                                        }
                                        button="???"
                                    />

                                    <Option
                                        action={() => {
                                            setWordsCount(24);
                                            setStatus('select-advanced-recovery');
                                        }}
                                        title="??"
                                        text={
                                            <Translation
                                                {...messages.TR_WORDS}
                                                values={{ count: '24' }}
                                            />
                                        }
                                        button="???"
                                    />
                                </Wrapper.Options>
                            </>
                        )}
                        {getStatus() === 'select-advanced-recovery' && (
                            <>
                                <Text>
                                    <Translation
                                        {...messages.TR_RECOVERY_TYPES_DESCRIPTION}
                                        values={{
                                            TR_LEARN_MORE_LINK: (
                                                <Link href={RECOVERY_MODEL_ONE_URL}>
                                                    <Translation {...messages.TR_LEARN_MORE_LINK} />
                                                </Link>
                                            ),
                                        }}
                                    />
                                </Text>
                                <Wrapper.Options>
                                    <Option
                                        action={() => {
                                            setAdvancedRecovery(false);
                                            recoverDevice();
                                        }}
                                        title="??"
                                        text={
                                            <Translation {...messages.TR_BASIC_RECOVERY_OPTION} />
                                        }
                                        button="???"
                                    />

                                    <Option
                                        action={() => {
                                            setAdvancedRecovery(true);
                                            recoverDevice();
                                        }}
                                        title="??"
                                        text={
                                            <Translation
                                                {...messages.TR_ADVANCED_RECOVERY_OPTION}
                                            />
                                        }
                                        button="???"
                                    />
                                </Wrapper.Options>

                                <Wrapper.Controls>
                                    <OnboardingButton.Alt
                                        onClick={() => {
                                            setStatus(null);
                                        }}
                                    >
                                        <Translation {...messages.TR_BACK} />
                                    </OnboardingButton.Alt>
                                </Wrapper.Controls>
                            </>
                        )}
                        {getStatus() === 'success' && (
                            <Wrapper.Controls>
                                <OnboardingButton.Cta onClick={() => goToNextStep()}>
                                    Continue
                                </OnboardingButton.Cta>
                            </Wrapper.Controls>
                        )}
                        {getStatus() === 'error' && (
                            <>
                                <Text>
                                    {/* TODO: device disconnected error is returned as string, other connect errors are objects */}
                                    <Translation
                                        {...messages.TR_RECOVERY_ERROR}
                                        values={{
                                            error:
                                                typeof deviceCall.error === 'string'
                                                    ? deviceCall.error
                                                    : '',
                                        }}
                                    />
                                </Text>
                                <OnboardingButton.Cta
                                    onClick={() => {
                                        // todo:
                                        // props.connectActions.resetCall();
                                        setStatus(null);
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
                    <OnboardingButton.Back onClick={() => goToPreviousStep()}>
                        Back
                    </OnboardingButton.Back>
                )}
            </Wrapper.StepFooter>
        </Wrapper.Step>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(RecoveryStepModelOne);
