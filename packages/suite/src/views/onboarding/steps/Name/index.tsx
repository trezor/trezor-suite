import React from 'react';
import { Button, Input } from '@trezor/components';
import styled from 'styled-components';
import { FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import { ConnectActions, ConnectReducer } from '@suite/types/onboarding/connect';
import { OnboardingActions } from '@suite/types/onboarding/onboarding';
import { DEFAULT_LABEL } from '@suite/constants/onboarding/trezor';
import { validateASCII } from '@suite/utils/onboarding/validate';
import l10nCommonMessages from '@suite/support/commonMessages';
import Text from '@suite/components/onboarding/Text';
import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
} from '@suite/components/onboarding/Wrapper';

import l10nMessages from './index.messages';

interface NameInputProps {
    value: string;
}
const NameInput = styled(Input)<NameInputProps>`
    max-width: 400px;
    min-height: 65px;
`;

interface Props {
    connectActions: ConnectActions;
    device: ConnectReducer['device'];
    deviceCall: ConnectReducer['deviceCall'];
    onboardingActions: OnboardingActions;
}

interface State {
    label: string;
}

class NameStep extends React.Component<Props & InjectedIntlProps, State> {
    state: State = {
        label: '',
    };

    changeLabel = () => {
        const { label } = this.state;
        this.props.connectActions.applySettings({ label });
    };

    handleInputChange = (event: any) => {
        this.setState({ label: event.target.value } as State);
    };

    getStatus = () => {
        const { device } = this.props;
        if (device!.features!.label !== DEFAULT_LABEL) {
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
        if (!validateASCII(this.state.label)) {
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
            <StepWrapper>
                <StepHeadingWrapper>
                    {status === 'initial' && <FormattedMessage {...l10nMessages.TR_NAME_HEADING} />}
                    {status === 'changed' && (
                        <FormattedMessage
                            {...l10nMessages.TR_NAME_HEADING_CHANGED}
                            values={{ label: device!.features!.label }}
                        />
                    )}
                </StepHeadingWrapper>
                <StepBodyWrapper>
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

                            <ControlsWrapper>
                                <Button
                                    isWhite
                                    onClick={() => this.props.onboardingActions.goToNextStep()}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_SKIP} />
                                </Button>
                                <Button
                                    isDisabled={this.validateInput().state !== 'success'}
                                    onClick={this.changeLabel}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_SUBMIT} />
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}

                    {status === 'changed' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_NAME_CHANGED_TEXT} />
                            </Text>
                            <ControlsWrapper>
                                <Button onClick={() => this.props.onboardingActions.goToNextStep()}>
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                </Button>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}
                </StepBodyWrapper>
            </StepWrapper>
        );
    }
}

export default injectIntl(NameStep);
