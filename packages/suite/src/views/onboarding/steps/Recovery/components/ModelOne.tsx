import React, { useState } from 'react';
import { injectIntl, WrappedComponentProps, FormattedMessage } from 'react-intl';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { P, Link } from '@trezor/components';

import { RECOVER_DEVICE } from '@onboarding-actions/constants/calls';
import {
    WORD_REQUEST_PLAIN,
    WORD_REQUEST_MATRIX9,
    WORD_REQUEST_MATRIX6,
} from '@onboarding-actions/constants/events';

import { RECOVERY_MODEL_ONE_URL } from '@onboarding-constants/urls';

import l10nCommonMessages from '@suite-support/Messages';
import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as recoveryActions from '@onboarding-actions/recoveryActions';
import * as connectActions from '@onboarding-actions/connectActions';
import { BlindMatrix, Option, Text, Wrapper, OnboardingButton } from '@onboarding-components';
import l10nMessages from './ModelOne.messages';
import l10nRecoveryMessages from '../index.messages';
import WordsInput from './WordsInput';
import { Dispatch, AppState } from '@suite-types';

const mapStateToProps = (state: AppState) => ({
    device: state.suite.device,
    deviceCall: state.onboarding.deviceCall,
    uiInteraction: state.onboarding.uiInteraction,
    recovery: state.onboarding.recovery,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
        goToSubStep: bindActionCreators(onboardingActions.goToSubStep, dispatch),
        goToPreviousStep: bindActionCreators(onboardingActions.goToPreviousStep, dispatch),
    },
    recoveryActions: {
        setWordsCount: bindActionCreators(recoveryActions.setWordsCount, dispatch),
        submit: bindActionCreators(recoveryActions.submit, dispatch),
        setAdvancedRecovery: bindActionCreators(recoveryActions.setAdvancedRecovery, dispatch),
    },
    connectActions: {
        recoveryDevice: bindActionCreators(connectActions.recoveryDevice, dispatch),
        resetCall: bindActionCreators(connectActions.resetCall, dispatch),
    },
});

type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    WrappedComponentProps;

type Status = null | 'select-advanced-recovery';

const RecoveryStepModelOne = (props: Props) => {
    const [status, setStatus] = useState<Status>(null);

    const {
        recoveryActions,
        recovery,
        device,
        uiInteraction,
        deviceCall,
        connectActions,
        onboardingActions,
    } = props;

    if (!device || !device.features) {
        return null;
    }

    const getStatus = () => {
        if (deviceCall.result && deviceCall.name === RECOVER_DEVICE) {
            return 'success';
        }
        if (
            deviceCall.error &&
            // todo: typescript
            // @ts-ignore
            !(deviceCall.error.code && deviceCall.error.code !== 'Failure_ActionCancelled') &&
            deviceCall.name === RECOVER_DEVICE
        ) {
            return 'error';
        }
        if (uiInteraction.name === WORD_REQUEST_PLAIN) {
            return 'recovering';
        }
        if (
            uiInteraction.name === WORD_REQUEST_MATRIX6 ||
            uiInteraction.name === WORD_REQUEST_MATRIX9
        ) {
            return 'recovering-advanced';
        }
        return status;
    };

    const recoveryDevice = () => {
        connectActions.recoveryDevice();
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
                {getStatus() === null && (
                    <>
                        <Text>
                            <FormattedMessage {...l10nMessages.TR_RECOVER_SUBHEADING} />
                        </Text>
                        <Wrapper.Options>
                            <Option
                                isSelected={recovery.wordsCount === 12}
                                onClick={() => {
                                    recoveryActions.setWordsCount(12);
                                }}
                            >
                                <P>
                                    <FormattedMessage
                                        {...l10nMessages.TR_WORDS}
                                        values={{ count: '12' }}
                                    />
                                </P>
                            </Option>
                            <Option
                                isSelected={recovery.wordsCount === 18}
                                onClick={() => {
                                    recoveryActions.setWordsCount(18);
                                }}
                            >
                                <P>
                                    <FormattedMessage
                                        {...l10nMessages.TR_WORDS}
                                        values={{ count: '18' }}
                                    />
                                </P>
                            </Option>
                            <Option
                                isSelected={recovery.wordsCount === 24}
                                onClick={() => {
                                    recoveryActions.setWordsCount(24);
                                }}
                            >
                                <P>
                                    <FormattedMessage
                                        {...l10nMessages.TR_WORDS}
                                        values={{ count: '24' }}
                                    />
                                </P>
                            </Option>
                        </Wrapper.Options>

                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                isDisabled={recovery.wordsCount === null}
                                onClick={() => {
                                    setStatus('select-advanced-recovery');
                                }}
                            >
                                <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    </>
                )}
                {getStatus() === 'select-advanced-recovery' && (
                    <>
                        <Text>
                            <FormattedMessage
                                {...l10nMessages.TR_RECOVERY_TYPES_DESCRIPTION}
                                values={{
                                    TR_LEARN_MORE_LINK: (
                                        <Link href={RECOVERY_MODEL_ONE_URL} variant="nostyle">
                                            <FormattedMessage
                                                {...l10nCommonMessages.TR_LEARN_MORE_LINK}
                                            />
                                        </Link>
                                    ),
                                }}
                            />
                        </Text>
                        <Wrapper.Options>
                            <Option
                                isSelected={recovery.advancedRecovery === false}
                                onClick={() => {
                                    recoveryActions.setAdvancedRecovery(false);
                                }}
                            >
                                <P>
                                    <FormattedMessage {...l10nMessages.TR_BASIC_RECOVERY_OPTION} />
                                </P>
                            </Option>
                            <Option
                                isSelected={recovery.advancedRecovery === true}
                                onClick={() => {
                                    recoveryActions.setAdvancedRecovery(true);
                                }}
                            >
                                <P>
                                    <FormattedMessage
                                        {...l10nMessages.TR_ADVANCED_RECOVERY_OPTION}
                                    />
                                </P>
                            </Option>
                        </Wrapper.Options>

                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => {
                                    recoveryDevice();
                                }}
                            >
                                <FormattedMessage {...l10nRecoveryMessages.TR_START_RECOVERY} />
                            </OnboardingButton.Cta>

                            <OnboardingButton.Alt
                                onClick={() => {
                                    //  props.onboardingActions.goToSubStep(null);
                                    setStatus(null);
                                }}
                            >
                                <FormattedMessage {...l10nCommonMessages.TR_BACK} />
                            </OnboardingButton.Alt>
                        </Wrapper.Controls>
                    </>
                )}
                {getStatus() === 'recovering' && (
                    <WordsInput
                        wordsCount={recovery.wordsCount}
                        counter={uiInteraction.counter}
                        onSubmit={recoveryActions.submit}
                    />
                )}
                {getStatus() === 'recovering-advanced' && (
                    <>
                        <BlindMatrix
                            count={uiInteraction.name === WORD_REQUEST_MATRIX9 ? 9 : 6}
                            onSubmit={recoveryActions.submit}
                        />
                    </>
                )}
                {getStatus() === 'success' && (
                    <Wrapper.Controls>
                        <OnboardingButton.Cta onClick={() => onboardingActions.goToNextStep()}>
                            Continue
                        </OnboardingButton.Cta>
                    </Wrapper.Controls>
                )}
                {getStatus() === 'error' && (
                    <>
                        <Text>
                            {/* TODO: device disconnected error is returned as string, other connect errors are objects */}
                            <FormattedMessage
                                {...l10nRecoveryMessages.TR_RECOVERY_ERROR}
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
                                props.connectActions.resetCall();
                                setStatus(null);
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
    )(RecoveryStepModelOne),
);
