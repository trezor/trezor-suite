/* @flow */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';


import colors from 'config/colors';
import { FONT_SIZE, TRANSITION } from 'config/variables';

import { H2 } from 'components/Heading';
import P from 'components/Paragraph';
import Checkbox from 'components/Checkbox';
import Button from 'components/Button';
import Input from 'components/inputs/Input';

import type { TrezorDevice } from 'flowtype';
import l10nCommonMessages from 'views/common.messages';
import l10nMessages from './index.messages';
import type { Props as BaseProps } from '../../Container';

type Props = {
    device: TrezorDevice;
    selectedDevice: ?TrezorDevice;
    onPassphraseSubmit: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onPassphraseSubmit'>;
}

type State = {
    deviceLabel: string,
    shouldShowSingleInput: boolean,
    passphraseInputValue: string,
    passphraseCheckInputValue: string,
    doPassphraseInputsMatch: boolean,
    isPassphraseHidden: boolean,
};

const Wrapper = styled.div`
    padding: 30px 48px;
    max-width: 390px;
`;

const Label = styled.div`
    ${colors.TEXT_SECONDARY};
    font-size: ${FONT_SIZE.BASE};
    padding-bottom: 5px;
`;

const PassphraseError = styled.div`
    margin-top: 8px;
    color: ${colors.ERROR_PRIMARY};
`;

const Row = styled.div`
    position: relative;
    text-align: left;
    padding-top: 24px;
    display: flex;
    flex-direction: column;
`;

const Footer = styled.div`
    display: flex;
    padding-top: 10px;
    align-items: center;
    flex-direction: column;
    justify-content: center;
`;

const LinkButton = styled(Button)`
    padding: 0;
    margin: 0;
    text-decoration: none;
    cursor: pointer;
    transition: ${TRANSITION.HOVER};
    font-size: ${FONT_SIZE.SMALL};
    border-radius: 0;
    border-bottom: 1px solid ${colors.GREEN_PRIMARY};
    background: transparent;

    &,
    &:visited,
    &:active,
    &:hover {
        color: ${colors.GREEN_PRIMARY};
    }

    &:hover {
        border-color: transparent;
        background: transparent;
    }
`;

class Passphrase extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);
        const { device, selectedDevice } = props;

        // if device is already remembered then only one input is presented
        let deviceLabel = device.label;
        let shouldShowSingleInput = false;
        if (selectedDevice && selectedDevice.path === device.path) {
            deviceLabel = selectedDevice.instanceLabel;
            shouldShowSingleInput = selectedDevice.remember || selectedDevice.state !== null;
        }

        this.state = {
            deviceLabel,
            shouldShowSingleInput,
            passphraseInputValue: '',
            passphraseCheckInputValue: '',
            doPassphraseInputsMatch: true,
            isPassphraseHidden: true,
        };
    }

    componentDidMount() {
        this.passphraseInput.focus();

        this.handleKeyPress = this.handleKeyPress.bind(this);
        window.addEventListener('keypress', this.handleKeyPress, false);
    }

    componentWillUnmount() {
        window.removeEventListener('keypress', this.handleKeyPress, false);
    }

    handleKeyPress: (event: KeyboardEvent) => void;

    passphraseInput: HTMLInputElement;

    handleInputChange(event: Event) {
        const { target } = event;
        if (target instanceof HTMLInputElement) {
            const inputValue = target.value;
            const inputName = target.name;

            let doPassphraseInputsMatch = false;
            if (inputName === 'passphraseInputValue') {
                // If passphrase is not hidden the second input should get filled automatically
                // and should be disabled
                if (this.state.isPassphraseHidden) {
                    doPassphraseInputsMatch = inputValue === this.state.passphraseCheckInputValue;
                } else {
                    // Since both inputs are same they really do match
                    // see: comment above
                    this.setState({
                        passphraseCheckInputValue: inputValue,
                    });
                    doPassphraseInputsMatch = true;
                }
            } else if (inputName === 'passphraseCheckInputValue') {
                doPassphraseInputsMatch = inputValue === this.state.passphraseInputValue;
            }

            if (this.state.shouldShowSingleInput) {
                doPassphraseInputsMatch = true;
            }

            this.setState({
                [inputName]: inputValue,
                doPassphraseInputsMatch,
            });
        }
    }

    handleCheckboxClick() {
        let match = false;
        if (this.state.shouldShowSingleInput || this.state.passphraseInputValue === this.state.passphraseCheckInputValue) {
            match = true;
        } else {
            match = !!this.state.isPassphraseHidden;
        }

        this.setState(previousState => ({
            isPassphraseHidden: !previousState.isPassphraseHidden,
            passphraseInputValue: previousState.passphraseInputValue,
            passphraseCheckInputValue: previousState.passphraseInputValue,
            doPassphraseInputsMatch: match,
        }));
    }

    submitPassphrase(shouldLeavePassphraseBlank: boolean = false) {
        const { onPassphraseSubmit } = this.props;
        const passphrase = this.state.passphraseInputValue;

        // Reset state so same passphrase isn't filled when the modal will be visible again
        this.setState({
            passphraseInputValue: '',
            passphraseCheckInputValue: '',
            doPassphraseInputsMatch: true,
            isPassphraseHidden: true,
        });

        onPassphraseSubmit(shouldLeavePassphraseBlank ? '' : passphrase);
    }

    handleKeyPress(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (this.state.doPassphraseInputsMatch) {
                this.submitPassphrase();
            }
        }
    }

    render() {
        return (
            <Wrapper>
                <H2>
                    <FormattedMessage
                        {...l10nMessages.TR_ENTER_DEVICE_PASSPHRASE}
                        values={{
                            deviceLabel: this.state.deviceLabel,
                        }}
                    />
                </H2>
                <P isSmaller>
                    <FormattedMessage {...l10nMessages.TR_NOTE_COLON_PASSPHRASE} />
                    {' '}
                    <FormattedMessage {...l10nMessages.TR_IF_YOU_FORGET_YOUR_PASSPHRASE_COMMA} />
                </P>
                <Row>
                    <Label>
                        <FormattedMessage {...l10nMessages.TR_PASSPHRASE} />
                    </Label>
                    <Input
                        innerRef={(input) => { this.passphraseInput = input; }}
                        name="passphraseInputValue"
                        type={this.state.isPassphraseHidden ? 'password' : 'text'}
                        autocorrect="off"
                        autocapitalize="off"
                        autocomplete="off"
                        value={this.state.passphraseInputValue}
                        onChange={event => this.handleInputChange(event)}
                    />
                </Row>
                {!this.state.shouldShowSingleInput && (
                    <Row>
                        <Label>
                            <FormattedMessage {...l10nMessages.TR_CONFIRM_PASSPHRASE} />
                        </Label>
                        <Input
                            name="passphraseCheckInputValue"
                            type={this.state.isPassphraseHidden ? 'password' : 'text'}
                            autocorrect="off"
                            autocapitalize="off"
                            autocomplete="off"
                            value={this.state.passphraseCheckInputValue}
                            onChange={event => this.handleInputChange(event)}
                            isDisabled={!this.state.isPassphraseHidden}
                        />
                    </Row>
                )}
                {!this.state.doPassphraseInputsMatch && (
                    <PassphraseError>
                        <FormattedMessage {...l10nMessages.TR_PASSPHRASES_DO_NOT_MATCH} />
                    </PassphraseError>
                )}
                <Row>
                    <Checkbox
                        isChecked={!this.state.isPassphraseHidden}
                        onClick={() => this.handleCheckboxClick()}
                    >
                        <FormattedMessage {...l10nMessages.TR_SHOW_PASSPHRASE} />
                    </Checkbox>
                </Row>
                <Row>
                    <Button
                        isDisabled={!this.state.doPassphraseInputsMatch}
                        onClick={() => this.submitPassphrase()}
                    >
                        <FormattedMessage {...l10nMessages.TR_ENTER} />
                    </Button>
                </Row>
                <Footer>
                    <P isSmaller>
                        <FormattedMessage
                            {...l10nMessages.TR_CHANGED_YOUR_MIND}
                            values={{
                                TR_GO_TO_STANDARD_WALLET: (
                                    <LinkButton
                                        isGreen
                                        onClick={() => this.submitPassphrase(true)}
                                    >
                                        <FormattedMessage {...l10nCommonMessages.TR_GO_TO_STANDARD_WALLET} />
                                    </LinkButton>
                                ),
                            }}
                        />
                    </P>
                </Footer>
            </Wrapper>
        );
    }
}

Passphrase.propTypes = {
    device: PropTypes.object.isRequired,
    selectedDevice: PropTypes.object.isRequired,
    onPassphraseSubmit: PropTypes.func.isRequired,
};

export default Passphrase;