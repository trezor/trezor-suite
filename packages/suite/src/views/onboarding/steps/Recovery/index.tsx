import React, { CSSProperties } from 'react';
import styled, { keyframes } from 'styled-components';
import { createFilter } from 'react-select';
import { FormattedMessage } from 'react-intl';
import { P, Select, Link } from '@trezor/components';

import colors from '@onboarding-config/colors';

import { RECOVER_DEVICE } from '@onboarding-actions/constants/calls';
import {
    WORD_REQUEST_PLAIN,
    WORD_REQUEST_MATRIX9,
    WORD_REQUEST_MATRIX6,
} from '@onboarding-actions/constants/events';

import bip39List from '@onboarding-constants/bip39';
import { RECOVERY_MODEL_ONE_URL } from '@onboarding-constants/urls';

import l10nCommonMessages from '@suite-support/Messages';
import { BlindMatrix, Option, Text, Wrapper, OnboardingButton } from '@onboarding-components';
import l10nMessages from './index.messages';
import { Props } from './Container';

const sortedBip39 = bip39List.map(item => ({ label: item, value: item }));

// todo: if agreed on, refactor to animations.
const shake = keyframes`
    10%, 90% {
        transform: translate3d(-1px, 0, 0);
    }

    20%, 80% {
        transform: translate3d(2px, 0, 0);
    }

    30%, 50%, 70% {
        transform: translate3d(-4px, 0, 0);
    }

    40%, 60% {
        transform: translate3d(4px, 0, 0);
    }
`;

const SelectWrapper = styled.div`
    min-width: 400px;
    animation: ${shake} 1.3s;
    margin-top: 10px;
`;

type Status = null | 'select-advanced-recovery';
interface RecoveryStepState {
    status: Status;
}

class RecoveryStep extends React.Component<Props> {
    state: RecoveryStepState = {
        status: null,
    };

    componentWillMount() {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    onSubmit = () => {
        this.props.recoveryActions.submit();
    };

    setStatus = (status: Status) => {
        this.setState(prevState => ({
            ...prevState,
            status,
        }));
    };

    getStatus = () => {
        const { deviceCall, uiInteraction } = this.props;

        if (deviceCall.result && deviceCall.name === RECOVER_DEVICE) {
            return 'success';
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
        if (deviceCall.error && deviceCall.name === RECOVER_DEVICE) {
            return 'error';
        }
        return this.state.status;
    };

    hideForModelT = () => {
        const { device, deviceCall } = this.props;
        return (
            !deviceCall.result &&
            !deviceCall.error &&
            deviceCall.name === RECOVER_DEVICE &&
            device &&
            device.features &&
            device.features.major_version === 2
        );
    };

    keyboardHandler(event: KeyboardEvent) {
        // 13 enter, 9 tab
        if (event.keyCode === 13 || event.keyCode === 9) {
            this.onSubmit();
        }
    }

    recoveryDevice() {
        this.props.connectActions.recoveryDevice();
    }

    render() {
        const { uiInteraction, device } = this.props;

        // todo: model T does not need UI
        if (this.hideForModelT()) {
            return null;
        }
        return (
            <Wrapper.Step>
                <Wrapper.StepHeading>
                    {this.getStatus() === null && 'Recover your device from seed'}
                    {this.getStatus() === 'recovering' && 'Entering seedwords'}
                    {this.getStatus() === 'select-advanced-recovery' && 'Select recovery method'}
                    {this.getStatus() === 'success' && 'Device recovered from seed'}
                </Wrapper.StepHeading>
                <Wrapper.StepBody>
                    {this.getStatus() === null && (
                        <React.Fragment>
                            {device!.features!.major_version === 1 && (
                                <React.Fragment>
                                    <Text>
                                        <FormattedMessage {...l10nMessages.TR_RECOVER_SUBHEADING} />
                                    </Text>
                                    <Wrapper.Options>
                                        <Option
                                            isSelected={this.props.recovery.wordsCount === 12}
                                            onClick={() => {
                                                this.props.recoveryActions.setWordsCount(12);
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
                                            isSelected={this.props.recovery.wordsCount === 18}
                                            onClick={() => {
                                                this.props.recoveryActions.setWordsCount(18);
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
                                            isSelected={this.props.recovery.wordsCount === 24}
                                            onClick={() => {
                                                this.props.recoveryActions.setWordsCount(24);
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
                                            isDisabled={this.props.recovery.wordsCount === null}
                                            onClick={() => {
                                                this.setStatus('select-advanced-recovery');
                                            }}
                                        >
                                            <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                        </OnboardingButton.Cta>
                                    </Wrapper.Controls>
                                </React.Fragment>
                            )}

                            {device!.features!.major_version === 2 && (
                                <React.Fragment>
                                    <Text>
                                        <FormattedMessage {...l10nMessages.TR_RECOVER_SUBHEADING} />
                                    </Text>
                                    <Wrapper.Controls>
                                        <OnboardingButton.Cta
                                            onClick={() => {
                                                this.recoveryDevice();
                                            }}
                                        >
                                            <FormattedMessage {...l10nMessages.TR_START_RECOVERY} />
                                        </OnboardingButton.Cta>
                                    </Wrapper.Controls>
                                </React.Fragment>
                            )}
                        </React.Fragment>
                    )}
                    {this.getStatus() === 'select-advanced-recovery' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage
                                    {...l10nMessages.TR_RECOVERY_TYPES_DESCRIPTION}
                                    values={{
                                        TR_LEARN_MORE_LINK: (
                                            <Link href={RECOVERY_MODEL_ONE_URL}>
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
                                    isSelected={this.props.recovery.advancedRecovery === false}
                                    onClick={() => {
                                        this.props.recoveryActions.setAdvancedRecovery(false);
                                    }}
                                >
                                    <P>
                                        <FormattedMessage
                                            {...l10nMessages.TR_BASIC_RECOVERY_OPTION}
                                        />
                                    </P>
                                </Option>
                                <Option
                                    isSelected={this.props.recovery.advancedRecovery === true}
                                    onClick={() => {
                                        this.props.recoveryActions.setAdvancedRecovery(true);
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
                                        this.recoveryDevice();
                                    }}
                                >
                                    <FormattedMessage {...l10nMessages.TR_START_RECOVERY} />
                                </OnboardingButton.Cta>

                                <OnboardingButton.Alt
                                    onClick={() => {
                                        // this.props.onboardingActions.goToSubStep(null);
                                        this.setStatus(null);
                                    }}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_BACK} />
                                </OnboardingButton.Alt>
                            </Wrapper.Controls>
                        </React.Fragment>
                    )}
                    {this.getStatus() === 'recovering' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage
                                    {...l10nMessages.TR_ENTER_SEED_WORDS_INSTRUCTION}
                                />{' '}
                                {this.props.recovery.wordsCount < 24 && (
                                    <FormattedMessage
                                        {...l10nMessages.TR_RANDOM_SEED_WORDS_DISCLAIMER}
                                        values={{ count: 24 - this.props.recovery.wordsCount }}
                                    />
                                )}
                            </Text>
                            <SelectWrapper>
                                <Select
                                    styles={{
                                        option: (provided: CSSProperties, state: any) => ({
                                            ...provided,
                                            backgroundColor: state.isFocused
                                                ? colors.brandPrimary
                                                : provided.backgroundColor,
                                            color: state.isFocused
                                                ? colors.grayLight
                                                : colors.grayDark,
                                            textAlign: 'initial',
                                        }),
                                        control: (provided: CSSProperties, state: any) => ({
                                            ...provided,
                                            boxShadow: `0 0 0 1px ${colors.brandPrimary}`,
                                            '&:hover': {
                                                borderColor: colors.brandPrimary,
                                            },
                                            borderColor: state.isFocused
                                                ? colors.brandPrimary
                                                : 'transparent',
                                        }),
                                        dropdownIndicator: () => ({ display: 'none' }),
                                        indicatorSeparator: () => ({ display: 'none' }),
                                        menu: (provided: CSSProperties) => {
                                            if (!this.props.recovery.word) {
                                                return { display: 'none' };
                                            }
                                            return provided;
                                        },
                                    }}
                                    autoFocus
                                    isSearchable
                                    // withDropdownIndicator={false}
                                    isClearable={false}
                                    value={this.props.recovery.word as any}
                                    noOptionsMessage={({ inputValue }: { inputValue: string }) =>
                                        `word "${inputValue}" does not exist in words list`
                                    }
                                    onChange={(item: any) => {
                                        this.props.recoveryActions.setWord(item.value);
                                        this.props.recoveryActions.submit();
                                    }}
                                    placeholder={this.props.intl.formatMessage(
                                        l10nMessages.TR_CHECK_YOUR_DEVICE,
                                    )}
                                    options={sortedBip39 as any}
                                    filterOption={createFilter({
                                        ignoreCase: true,
                                        trim: true,
                                        matchFrom: 'start',
                                    })}
                                    onInputChange={(input: string) => {
                                        if (input) {
                                            this.props.recoveryActions.setWord(input);
                                        }
                                    }}
                                />
                            </SelectWrapper>
                            {uiInteraction.counter > 1 && (
                                <P size="small">
                                    <FormattedMessage
                                        {...l10nMessages.TR_MORE_WORDS_TO_ENTER}
                                        values={{ count: 26 - uiInteraction.counter }}
                                    />
                                </P>
                            )}
                        </React.Fragment>
                    )}
                    {this.getStatus() === 'recovering-advanced' && (
                        <React.Fragment>
                            <BlindMatrix
                                count={uiInteraction.name === WORD_REQUEST_MATRIX9 ? 9 : 6}
                                onSubmit={this.props.recoveryActions.submit}
                            />
                        </React.Fragment>
                    )}
                    {this.getStatus() === 'success' && (
                        <Wrapper.Controls>
                            <OnboardingButton.Cta
                                onClick={() => this.props.onboardingActions.goToNextStep()}
                            >
                                Continue
                            </OnboardingButton.Cta>
                        </Wrapper.Controls>
                    )}
                    {this.getStatus() === 'error' && (
                        <React.Fragment>
                            Error // todo: rework
                            {/* <Text style={{ color: colors.error }}>
                                <FormattedMessage
                                    {...l10nMessages.TR_RECOVERY_ERROR}
                                    values={{ error: deviceCall.error.code }}
                                />
                            </Text> */}
                            <OnboardingButton.Cta
                                onClick={() => {
                                    this.props.connectActions.resetCall();
                                    this.setStatus(null);
                                }}
                            >
                                <FormattedMessage {...l10nCommonMessages.TR_RETRY} />
                            </OnboardingButton.Cta>
                        </React.Fragment>
                    )}
                </Wrapper.StepBody>

                <Wrapper.StepFooter>
                    {this.getStatus() == null && (
                        <OnboardingButton.Back
                            onClick={this.props.onboardingActions.goToPreviousStep}
                        >
                            Back
                        </OnboardingButton.Back>
                    )}
                </Wrapper.StepFooter>
            </Wrapper.Step>
        );
    }
}

export default RecoveryStep;
