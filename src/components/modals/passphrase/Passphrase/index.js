/* @flow */
import React, { PureComponent } from 'react';
import styled from 'styled-components';
import colors from 'config/colors';
import { FONT_SIZE, TRANSITION } from 'config/variables';
import { H2 } from 'components/Heading';
import P from 'components/Paragraph';
import Checkbox from 'components/Checkbox';
import Button from 'components/Button';
import Input from 'components/inputs/Input';
import { CONTEXT_DEVICE } from 'actions/constants/modal';

import type { Props } from '../../index';

type State = {
    deviceLabel: string,
    shouldShowSingleInput: boolean,
    passphraseInputValue: string,
    passphraseCheckInputValue: string,
    doPassphraseInputsMatch: boolean,
    isPassphraseHidden: boolean,
};

const Wrapper = styled.div`
    padding: 24px 48px;
    max-width: 390px;
`;

const Label = styled.div`
    ${colors.TEXT_SECONDARY};
    font-size: ${FONT_SIZE.SMALL};
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
    font-size: ${FONT_SIZE.SMALLER};
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

        if (props.modal.context !== CONTEXT_DEVICE) return;
        const { device } = props.modal;

        // Check if this device is already known
        // if device is already known then only one input is presented
        const { selectedDevice } = props.wallet;
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

    state: State;

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
        // If passphrase was visible and now shouldn't be --> delete the value of passphraseCheckInputValue
        // doPassphraseInputsMatch
        // - if passphrase was visible and now shouldn't be --> doPassphraseInputsMatch = false
        //  - because passphraseCheckInputValue will be empty string
        // - if passphrase wasn't visibe and now should be --> doPassphraseInputsMatch = true
        //  - because passphraseCheckInputValue will be same as passphraseInputValue
        let doInputsMatch = false;
        if (this.state.shouldShowSingleInput || this.state.passphraseInputValue === this.state.passphraseCheckInputValue) {
            doInputsMatch = true;
        } else {
            doInputsMatch = !!this.state.isPassphraseHidden;
        }

        this.setState(previousState => ({
            isPassphraseHidden: !previousState.isPassphraseHidden,
            passphraseInputValue: previousState.isPassphraseHidden ? previousState.passphraseInputValue : '',
            passphraseCheckInputValue: previousState.isPassphraseHidden ? previousState.passphraseInputValue : '',
            doPassphraseInputsMatch: doInputsMatch,
        }));
    }

    submitPassphrase(shouldLeavePassphraseBlank: boolean = false) {
        const { onPassphraseSubmit } = this.props.modalActions;
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
        if (this.props.modal.context !== CONTEXT_DEVICE) return null;

        return (
            <Wrapper>
                <H2>Enter {this.state.deviceLabel} passphrase</H2>
                <P isSmaller>Note that passphrase is case-sensitive. If you enter a wrong passphrase, you will not unlock the desired hidden wallet.</P>
                <Row>
                    <Label>Passphrase</Label>
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
                        <Label>Confirm passphrase</Label>
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
                    <PassphraseError>Passphrases do not match</PassphraseError>
                )}

                <Row>
                    <Checkbox
                        isChecked={!this.state.isPassphraseHidden}
                        onClick={() => this.handleCheckboxClick()}
                    >
                        Show passphrase
                    </Checkbox>
                </Row>
                <Row>
                    <Button
                        isDisabled={!this.state.doPassphraseInputsMatch}
                        onClick={() => this.submitPassphrase()}
                    >Enter
                    </Button>
                </Row>

                <Footer>
                    <P isSmaller>
                        Changed your mind? &nbsp;
                        <LinkButton
                            isGreen
                            onClick={() => this.submitPassphrase(true)}
                        >Go to your standard wallet
                        </LinkButton>
                    </P>
                </Footer>
            </Wrapper>
        );
    }
}

export default Passphrase;