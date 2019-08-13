import React, { CSSProperties } from 'react';
import styled, { keyframes } from 'styled-components';
import { createFilter } from 'react-select';
import { FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import { P, Select, Link } from '@trezor/components';

import BlindMatrix from '@onboarding-components/BlindMatrix';
import Option from '@onboarding-components/Option';
import Text from '@onboarding-components/Text';
import {
    ControlsWrapper,
    StepWrapper,
    StepBodyWrapper,
    OptionsWrapper,
    StepHeadingWrapper,
} from '@onboarding-components/Wrapper';
import { ButtonCta, ButtonAlt } from '@onboarding-components/Buttons';

import colors from '@onboarding-config/colors';

import { RECOVER_DEVICE } from '@onboarding-actions/constants/calls';
import {
    WORD_REQUEST_PLAIN,
    WORD_REQUEST_MATRIX9,
    WORD_REQUEST_MATRIX6,
} from '@onboarding-actions/constants/events';

import bip39List from '@onboarding-constants/bip39';
import { RECOVERY_MODEL_ONE_URL } from '@onboarding-constants/urls';

import * as onboardingActions from '@onboarding-actions/onboardingActions';
import * as connectActions from '@onboarding-actions/connectActions';
import * as recoveryActions from '@onboarding-actions/recoveryActions';

import l10nCommonMessages from '@suite-support/Messages';
import l10nMessages from './index.messages';
import { AppState } from '@suite-types';

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

interface RecoveryStepProps {
    onboardingActions: {
        goToNextStep: typeof onboardingActions.goToNextStep;
        setPath: typeof onboardingActions.setPath;
        goToSubStep: typeof onboardingActions.goToSubStep;
    };
    recoveryActions: {
        setWordsCount: typeof recoveryActions.setWordsCount;
        setWord: typeof recoveryActions.setWord;
        submit: typeof recoveryActions.submit;
        setAdvancedRecovery: typeof recoveryActions.setAdvancedRecovery;
    };
    connectActions: {
        recoveryDevice: typeof connectActions.recoveryDevice;
        resetCall: typeof connectActions.resetCall;
    };
    deviceCall: AppState['onboarding']['connect']['deviceCall'];
    uiInteraction: AppState['onboarding']['connect']['uiInteraction'];
    device: AppState['onboarding']['connect']['device'];
    recovery: AppState['onboarding']['recovery'];
}

type Status = null | 'select-advanced-recovery';
interface RecoveryStepState {
    status: Status;
}

class RecoveryStep extends React.Component<RecoveryStepProps & InjectedIntlProps> {
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

    recoveryDevice() {
        this.props.connectActions.recoveryDevice();
    }

    keyboardHandler(event: KeyboardEvent) {
        // 13 enter, 9 tab
        if (event.keyCode === 13 || event.keyCode === 9) {
            this.onSubmit();
        }
    }

    render() {
        const { deviceCall, uiInteraction, device } = this.props;

        return (
            <StepWrapper>
                {/* getStatus: {JSON.stringify(this.getStatus())} */}

                <StepHeadingWrapper>
                    {this.getStatus() === null && 'Recover your device from seed'}
                    {this.getStatus() === 'select-advanced-recovery' && 'Select recovery method'}
                </StepHeadingWrapper>
                <StepBodyWrapper>
                    {this.getStatus() === null && (
                        <React.Fragment>
                            {device!.features!.major_version === 1 && (
                                <React.Fragment>
                                    <Text>
                                        <FormattedMessage {...l10nMessages.TR_RECOVER_SUBHEADING} />
                                    </Text>
                                    <OptionsWrapper>
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
                                    </OptionsWrapper>

                                    <ControlsWrapper>
                                        <ButtonCta
                                            isDisabled={this.props.recovery.wordsCount === null}
                                            onClick={() => {
                                                this.setStatus('select-advanced-recovery');
                                            }}
                                        >
                                            <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                        </ButtonCta>
                                    </ControlsWrapper>
                                </React.Fragment>
                            )}

                            {device!.features!.major_version === 2 && (
                                <React.Fragment>
                                    <Text>
                                        <FormattedMessage {...l10nMessages.TR_RECOVER_SUBHEADING} />
                                    </Text>
                                    <ControlsWrapper>
                                        <ButtonCta
                                            onClick={() => {
                                                this.recoveryDevice();
                                            }}
                                        >
                                            <FormattedMessage {...l10nMessages.TR_START_RECOVERY} />
                                        </ButtonCta>
                                    </ControlsWrapper>
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
                            <OptionsWrapper>
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
                            </OptionsWrapper>

                            <ControlsWrapper>
                                <ButtonAlt
                                    onClick={() => {
                                        // this.props.onboardingActions.goToSubStep(null);
                                        this.setStatus(null);
                                    }}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_BACK} />
                                </ButtonAlt>
                                <ButtonCta
                                    onClick={() => {
                                        this.recoveryDevice();
                                    }}
                                >
                                    <FormattedMessage {...l10nMessages.TR_START_RECOVERY} />
                                </ButtonCta>
                            </ControlsWrapper>
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
                                        values={{ count: 25 - uiInteraction.counter }}
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
                        <ControlsWrapper>
                            <ButtonCta onClick={() => this.props.onboardingActions.goToNextStep()}>
                                Continue
                            </ButtonCta>
                        </ControlsWrapper>
                    )}
                    {this.getStatus() === 'error' && (
                        <React.Fragment>
                            <Text style={{ color: colors.error }}>
                                <FormattedMessage
                                    {...l10nMessages.TR_RECOVERY_ERROR}
                                    values={{ error: deviceCall.error }}
                                />
                            </Text>

                            <ButtonCta
                                onClick={() => {
                                    this.props.connectActions.resetCall();
                                    this.setStatus(null);
                                }}
                            >
                                <FormattedMessage {...l10nCommonMessages.TR_RETRY} />
                            </ButtonCta>
                        </React.Fragment>
                    )}
                </StepBodyWrapper>
            </StepWrapper>
        );
    }
}

export default injectIntl(RecoveryStep);
