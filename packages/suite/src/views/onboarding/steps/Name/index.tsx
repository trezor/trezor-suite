import React from 'react';
import { Input } from '@trezor/components';
import styled from 'styled-components';
import { FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import l10nCommonMessages from '@suite-support/Messages';
import { isASCII } from '@suite-utils/validators';
import { applySettings } from '@onboarding-actions/connectActions';
import { goToNextStep } from '@onboarding-actions/onboardingActions';
import { DEFAULT_LABEL } from '@onboarding-constants/trezor';
import Text from '@onboarding-components/Text';
import {
    StepWrapper,
    StepBodyWrapper,
    StepHeadingWrapper,
    ControlsWrapper,
} from '@onboarding-components/Wrapper';
import { ButtonCta, ButtonAlt } from '@onboarding-components/Buttons';
import { AppState } from '@suite-types';

import l10nMessages from './index.messages';

interface NameInputProps {
    value: string;
}
const NameInput = styled(Input)<NameInputProps>`
    max-width: 400px;
    min-height: 65px;
`;

interface StepProps {
    connectActions: {
        applySettings: typeof applySettings;
    };
    onboardingActions: {
        goToNextStep: typeof goToNextStep;
    };
    device: AppState['onboarding']['connect']['device'];
    deviceCall: AppState['onboarding']['connect']['deviceCall'];
}

interface StepState {
    label: string;
}

class NameStep extends React.Component<StepProps & InjectedIntlProps, StepState> {
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
                                <ButtonAlt
                                    onClick={() => this.props.onboardingActions.goToNextStep()}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_SKIP} />
                                </ButtonAlt>
                                <ButtonCta
                                    isDisabled={this.validateInput().state !== 'success'}
                                    onClick={this.changeLabel}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_SUBMIT} />
                                </ButtonCta>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}

                    {status === 'changed' && (
                        <React.Fragment>
                            <Text>
                                <FormattedMessage {...l10nMessages.TR_NAME_CHANGED_TEXT} />
                            </Text>
                            <ControlsWrapper>
                                <ButtonCta
                                    onClick={() => this.props.onboardingActions.goToNextStep()}
                                >
                                    <FormattedMessage {...l10nCommonMessages.TR_CONTINUE} />
                                </ButtonCta>
                            </ControlsWrapper>
                        </React.Fragment>
                    )}
                </StepBodyWrapper>
            </StepWrapper>
        );
    }
}

export default injectIntl(NameStep);
