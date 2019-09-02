import React from 'react';
import { Input } from '@trezor/components';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import l10nCommonMessages from '@suite-support/Messages';
import { isASCII } from '@suite-utils/validators';
import { DEFAULT_LABEL } from '@onboarding-constants/trezor';
import { Wrapper, OnboardingButton, Text } from '@onboarding-components';
import { Props } from './Container';

import l10nMessages from './index.messages';

interface NameInputProps {
    value: string;
}
const NameInput = styled(Input)<NameInputProps>`
    max-width: 400px;
    min-height: 65px;
`;

interface StepState {
    label: string;
}

class NameStep extends React.Component<Props, StepState> {
    state: StepState = {
        label: '',
    };

    changeLabel = () => {
        const { label } = this.state;
        this.props.connectActions.applySettings({ label });
    };

    handleInputChange = (event: any) => {
        this.setState({ label: event.target.value });
    };

    getStatus = () => {
        const { device } = this.props;
        if (device!.label !== DEFAULT_LABEL) {
            return 'changed';
        }
        return 'initial';
    };

    validateInput = (): { state: undefined | 'error' | 'success'; bottomText?: string } => {
        if (!this.state.label) {
            return { state: undefined };
        }
        if (this.state.label === DEFAULT_LABEL) {
            return {
                state: 'error',
                bottomText: this.props.intl.formatMessage(l10nMessages.TR_NAME_BORING),
            };
        }
        if (!isASCII(this.state.label)) {
            return {
                state: 'error',
                bottomText: this.props.intl.formatMessage(l10nMessages.TR_NAME_ONLY_ASCII),
            };
        }
        if (this.state.label.length > 16) {
            return {
                state: 'error',
                bottomText: this.props.intl.formatMessage(l10nMessages.TR_NAME_TOO_LONG),
            };
        }
        return {
            state: 'success',
            bottomText: this.props.intl.formatMessage(l10nMessages.TR_NAME_OK),
        };
    };

    render() {
        const { device } = this.props;
        const status = this.getStatus();
        return (
            <Wrapper.Step>
                <Wrapper.StepHeading>
                    {status === 'initial' && <FormattedMessage {...l10nMessages.TR_NAME_HEADING} />}
                    {status === 'changed' && (
                        <FormattedMessage
                            {...l10nMessages.TR_NAME_HEADING_CHANGED}
                            values={{ label: device!.features!.label }}
                        />
                    )}
                </Wrapper.StepHeading>
                <Wrapper.StepBody>
                    {status === 'initial' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_NAME_SUBHEADING} />
                            </Text>

                            <NameInput
                                value={this.state.label}
                                placeholder=""
                                state={this.validateInput().state}
                                bottomText={
                                    this.validateInput().bottomText
                                        ? this.validateInput().bottomText
                                        : ''
                                }
                                onChange={this.handleInputChange}
                                isDisabled={this.props.deviceCall.isProgress}
                            />

                            <Wrapper.Controls>
                                <OnboardingButton.Alt
                                    onClick={() => this.props.onboardingActions.goToNextStep()}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_SKIP} />
                                </OnboardingButton.Alt>
                                <OnboardingButton.Cta
                                    isDisabled={this.validateInput().state !== 'success'}
                                    onClick={this.changeLabel}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_SUBMIT} />
                                </OnboardingButton.Cta>
                            </Wrapper.Controls>
                        </React.Fragment>
                    )}

                    {status === 'changed' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_NAME_CHANGED_TEXT} />
                            </Text>
                            <Wrapper.Controls>
                                <OnboardingButton.Cta
                                    onClick={() => this.props.onboardingActions.goToNextStep()}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                </OnboardingButton.Cta>
                            </Wrapper.Controls>
                        </React.Fragment>
                    )}
                </Wrapper.StepBody>
            </Wrapper.Step>
        );
    }
}

export default NameStep;
