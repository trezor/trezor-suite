/* @flow */


import React, { Component } from 'react';
import raf from 'raf';

import type { Props } from './index';

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
    keyboardHandler: (event: KeyboardEvent) => void;

    state: State;

    passphraseInput: ?HTMLInputElement;

    passphraseRevisionInput: ?HTMLInputElement;

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
            singleInput = selected.remember;
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

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
        // this.passphraseInput.type = 'text';
        // this.passphraseInput.style.display = 'none';
        // this.passphraseRevisionInput.type = 'text';
        // this.passphraseRevisionInput.style.display = 'none';
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

        let passphraseInputValue: string = passphrase;
        let passphraseRevisionInputValue: string = passphraseRevision;
        if (!visible && !passphraseFocused) {
            passphraseInputValue = passphrase.replace(/./g, '•');
        }
        if (!visible && !passphraseRevisionFocused) {
            passphraseRevisionInputValue = passphraseRevision.replace(/./g, '•');
        }

        if (this.passphraseInput) {
            this.passphraseInput.value = passphraseInputValue;
            this.passphraseInput.setAttribute('type', visible || (!visible && !passphraseFocused) ? 'text' : 'password');
        }
        if (this.passphraseRevisionInput) {
            this.passphraseRevisionInput.value = passphraseRevisionInputValue;
            this.passphraseRevisionInput.setAttribute('type', visible || (!visible && !passphraseRevisionFocused) ? 'text' : 'password');
        }
    }

    onPassphraseChange = (input: string, value: string): void => {
        // https://codepen.io/MiDri/pen/PGqvrO
        // or
        // https://github.com/zakangelle/react-password-mask/blob/master/src/index.js
        if (input === 'passphrase') {
            this.setState({
                match: this.state.singleInput || this.state.passphraseRevision === value,
                passphrase: value,
            });
        } else {
            this.setState({
                match: this.state.passphrase === value,
                passphraseRevision: value,
                passphraseRevisionTouched: true,
            });
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
    }

    onPassphraseHide = (): void => {
        this.setState({
            visible: false,
        });
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

        const p = passphrase;

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
            <div className="passphrase">
                {/* <button className="close-modal transparent" onClick={ event => this.submit(true) }></button> */}
                <h3>Enter { deviceLabel } passphrase</h3>
                <p>Note that passphrase is case-sensitive.</p>
                <div className="row">
                    <label>Passphrase</label>
                    <input
                        ref={(element) => { this.passphraseInput = element; }}
                        onChange={event => this.onPassphraseChange('passphrase', event.currentTarget.value)}
                        type={passphraseInputType}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        onFocus={event => this.onPassphraseFocus('passphrase')}
                        onBlur={event => this.onPassphraseBlur('passphrase')}

                        tabIndex="1"
                    />
                </div>
                { singleInput ? null : (
                    <div className="row">
                        <label>Re-enter passphrase</label>
                        <input
                            ref={(element) => { this.passphraseRevisionInput = element; }}
                            onChange={event => this.onPassphraseChange('revision', event.currentTarget.value)}
                            type={passphraseRevisionInputType}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            data-lpignore="true"
                            onFocus={event => this.onPassphraseFocus('revision')}
                            onBlur={event => this.onPassphraseBlur('revision')}

                            tabIndex="2"
                        />
                        { !match && passphraseRevisionTouched ? <span className="error">Passphrases do not match</span> : null }
                    </div>
                ) }


                <div className="row">
                    <label className="custom-checkbox">
                        <input type="checkbox" tabIndex="3" onChange={showPassphraseCheckboxFn} checked={visible} />
                        <span className="indicator" />
                        Show passphrase
                    </label>
                    {/* <label className="custom-checkbox">
                        <input type="checkbox" className="save_passphrase" tabIndex="4" onChange={ savePassphraseCheckboxFn } checked={ passphraseCached } />
                        <span className="indicator"></span>
                        <span>Save passphrase for current session (i)</span>
                    </label> */}
                </div>

                <div>
                    <button type="button" className="submit" tabIndex="4" disabled={!match} onClick={event => this.submit()}>Enter</button>
                </div>

                <div>
                    <p>If you want to access your default account</p>
                    <p><a className="green" onClick={event => this.submit(true)}>Leave passphrase blank</a></p>
                </div>

            </div>
        );
    }
}