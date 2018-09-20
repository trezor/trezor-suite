/* @flow */
import React, { Component } from 'react';
import raf from 'raf';
import colors from 'config/colors';
import { H2 } from 'components/Heading';
import P from 'components/Paragraph';
import { FONT_SIZE } from 'config/variables';
import Link from 'components/Link';
import Checkbox from 'components/Checkbox';
import Button from 'components/Button';
import Input from 'components/inputs/Input';
import styled from 'styled-components';

import type { Props } from '../../index';

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

type State = {
    deviceLabel: string;
    singleInput: boolean;
    passphrase: string;
    passphraseRevision: string;
    passphraseFocused: boolean;
    passphraseRevisionFocused: boolean;
    passphraseRevisionTouched: boolean;
    match: boolean;
    visible: boolean;
}

export default class PinModal extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        const device = props.modal.opened ? props.modal.device : null;
        if (!device) return;

        // check if this device is already known
        const selected = props.wallet.selectedDevice;
        let deviceLabel = device.label;
        let singleInput = false;
        if (selected && selected.path === device.path) {
            deviceLabel = selected.instanceLabel;
            singleInput = selected.remember || selected.state !== null;
        }

        this.state = {
            deviceLabel,
            singleInput,
            passphrase: '',
            passphraseRevision: '',
            passphraseFocused: false,
            passphraseRevisionFocused: false,
            passphraseRevisionTouched: false,
            match: true,
            visible: false,
        };
    }

    keyboardHandler: (event: KeyboardEvent) => void;

    state: State;

    passphraseInput: ?HTMLInputElement;

    passphraseRevisionInput: ?HTMLInputElement;


    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13) {
            event.preventDefault();
            //this.passphraseInput.blur();
            //this.passphraseRevisionInput.blur();

            //this.passphraseInput.type = 'text';
            //this.passphraseRevisionInput.type = 'text';

            this.submit();

            // TODO: set timeout, or wait for blur event
            //onPassphraseSubmit(passphrase, passphraseCached);
            //raf(() => onPassphraseSubmit(passphrase));
        }
    }


    componentDidMount(): void {
        // one time autofocus
        if (this.passphraseInput) this.passphraseInput.focus();
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);


        // document.oncontextmenu = (event) => {
        //     const el = window.event.srcElement || event.target;
        //     const type = el.tagName.toLowerCase() || '';
        //     if (type === 'input') {
        //         return false;
        //     }
        // };
    }

    // we don't want to keep password inside "value" attribute,
    // so we need to replace it thru javascript
    componentDidUpdate() {
        const {
            passphrase,
            passphraseRevision,
            passphraseFocused,
            passphraseRevisionFocused,
            visible,
        } = this.state;
        // } = this.props.modal;

        const passphraseInputValue: string = passphrase;
        const passphraseRevisionInputValue: string = passphraseRevision;
        // if (!visible && !passphraseFocused) {
        //     passphraseInputValue = passphrase.replace(/./g, '•');
        // }
        // if (!visible && !passphraseRevisionFocused) {
        //     passphraseRevisionInputValue = passphraseRevision.replace(/./g, '•');
        // }


        if (this.passphraseInput) {
            // this.passphraseInput.value = passphraseInputValue;
            // this.passphraseInput.setAttribute('type', visible || (!visible && !passphraseFocused) ? 'text' : 'password');
            this.passphraseInput.setAttribute('type', visible ? 'text' : 'password');
        }
        if (this.passphraseRevisionInput) {
            // this.passphraseRevisionInput.value = passphraseRevisionInputValue;
            // this.passphraseRevisionInput.setAttribute('type', visible || (!visible && !passphraseRevisionFocused) ? 'text' : 'password');
            this.passphraseRevisionInput.setAttribute('type', visible ? 'text' : 'password');
        }
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
        // this.passphraseInput.type = 'text';
        // this.passphraseInput.style.display = 'none';
        // this.passphraseRevisionInput.type = 'text';
        // this.passphraseRevisionInput.style.display = 'none';
    }


    onPassphraseChange = (input: string, value: string): void => {
        // https://codepen.io/MiDri/pen/PGqvrO
        // or
        // https://github.com/zakangelle/react-password-mask/blob/master/src/index.js
        if (input === 'passphrase') {
            this.setState(previousState => ({
                match: previousState.singleInput || previousState.passphraseRevision === value,
                passphrase: value,
            }));

            if (this.state.visible && this.passphraseRevisionInput) {
                this.setState({
                    match: true,
                    passphraseRevision: value,
                });
                this.passphraseRevisionInput.value = value;
            }
        } else {
            this.setState(previousState => ({
                match: previousState.passphrase === value,
                passphraseRevision: value,
                passphraseRevisionTouched: true,
            }));
        }
    }

    onPassphraseFocus = (input: string): void => {
        if (input === 'passphrase') {
            this.setState({
                passphraseFocused: true,
            });
        } else {
            this.setState({
                passphraseRevisionFocused: true,
            });
        }
    }

    onPassphraseBlur = (input: string): void => {
        if (input === 'passphrase') {
            this.setState({
                passphraseFocused: false,
            });
        } else {
            this.setState({
                passphraseRevisionFocused: false,
            });
        }
    }

    onPassphraseShow = (): void => {
        this.setState({
            visible: true,
        });
        if (this.passphraseRevisionInput) {
            this.passphraseRevisionInput.disabled = true;
            this.passphraseRevisionInput.value = this.state.passphrase;
            this.setState(previousState => ({
                passphraseRevision: previousState.passphrase,
                match: true,
            }));
        }
    }

    onPassphraseHide = (): void => {
        this.setState({
            visible: false,
        });
        if (this.passphraseRevisionInput) {
            this.passphraseRevisionInput.value = '';
            this.setState({
                passphraseRevision: '',
                match: false,
            });
            this.passphraseRevisionInput.disabled = false;
        }
    }

    submit = (empty: boolean = false): void => {
        const { onPassphraseSubmit } = this.props.modalActions;
        const { passphrase, match } = this.state;

        if (!match) return;

        //this.passphraseInput.type = 'text';
        // this.passphraseInput.style.display = 'none';
        //this.passphraseInput.setAttribute('readonly', 'readonly');
        // this.passphraseRevisionInput.type = 'text';
        //this.passphraseRevisionInput.style.display = 'none';
        //this.passphraseRevisionInput.setAttribute('readonly', 'readonly');

        // const p = passphrase;

        this.setState({
            passphrase: '',
            passphraseRevision: '',
            passphraseFocused: false,
            passphraseRevisionFocused: false,
            visible: false,
        });

        raf(() => onPassphraseSubmit(empty ? '' : passphrase));
    }

    render() {
        if (!this.props.modal.opened) return null;

        const {
            device,
        } = this.props.modal;

        const {
            deviceLabel,
            singleInput,
            passphrase,
            passphraseRevision,
            passphraseFocused,
            passphraseRevisionFocused,
            visible,
            match,
            passphraseRevisionTouched,
        } = this.state;

        let passphraseInputType: string = visible || (!visible && !passphraseFocused) ? 'text' : 'password';
        let passphraseRevisionInputType: string = visible || (!visible && !passphraseRevisionFocused) ? 'text' : 'password';
        passphraseInputType = passphraseRevisionInputType = 'text';
        //let passphraseInputType: string = visible || passphraseFocused ? "text" : "password";
        //let passphraseRevisionInputType: string = visible || passphraseRevisionFocused ? "text" : "password";

        const showPassphraseCheckboxFn: Function = visible ? this.onPassphraseHide : this.onPassphraseShow;
        return (
            <Wrapper>
                <H2>Enter { deviceLabel } passphrase</H2>
                <P isSmaller>Note that passphrase is case-sensitive.</P>
                <Row>
                    <Label>Passphrase</Label>
                    <Input
                        innerRef={(element) => { this.passphraseInput = element; }}
                        onChange={event => this.onPassphraseChange('passphrase', event.currentTarget.value)}
                        type={passphraseInputType}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        onFocus={() => this.onPassphraseFocus('passphrase')}
                        onBlur={() => this.onPassphraseBlur('passphrase')}
                        tabIndex="0"
                    />
                </Row>
                {!singleInput && (
                    <Row>
                        <Label>Re-enter passphrase</Label>
                        <Input
                            innerRef={(element) => { this.passphraseRevisionInput = element; }}
                            onChange={event => this.onPassphraseChange('revision', event.currentTarget.value)}
                            type={passphraseRevisionInputType}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            data-lpignore="true"
                            onFocus={() => this.onPassphraseFocus('revision')}
                            onBlur={() => this.onPassphraseBlur('revision')}
                        />
                        {!match && passphraseRevisionTouched && <PassphraseError>Passphrases do not match</PassphraseError> }
                    </Row>
                ) }
                <Row>
                    <Checkbox onClick={showPassphraseCheckboxFn} checked={visible}>Show passphrase</Checkbox>
                </Row>
                <Row>
                    <Button type="button" disabled={!match} onClick={() => this.submit()}>Enter</Button>
                </Row>
                <Footer>
                    <P isSmaller>If you want to access your default account</P>
                    <P isSmaller>
                        <Link isGreen onClick={() => this.submit(true)}>Leave passphrase blank</Link>
                    </P>
                </Footer>
            </Wrapper>
        );
    }
}