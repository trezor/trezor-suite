/* @flow */
'use strict';

import React, { Component, KeyboardEvent, FocusEvent } from 'react';

export default class PinModal extends Component {

    input: HTMLInputElement;

    componentDidMount(): void {
        // one time autofocus
        this.input.focus();
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    keyboardHandler(event: KeyboardEvent): void {
        const { onPassphraseSubmit } = this.props;
        const { passphrase, passphraseCached } = this.props.modal;

        if (event.keyCode === 13) {
            event.preventDefault();
            this.input.blur();
            onPassphraseSubmit(passphrase, passphraseCached);
        }
    }

    // we don't want to keep password inside "value" attribute,
    // so we need to replace it thru javascript
    componentDidUpdate() {
        const { passphrase, passphraseFocused, passphraseVisible } = this.props.modal;
        let inputValue: string = passphrase;
        if (!passphraseVisible && !passphraseFocused) {
            inputValue = passphrase.replace(/./g, '•');
        }
        this.input.value = inputValue;
    }

    render(): void {

        const { 
            onPassphraseChange,
            onPassphraseSubmit,
            onPassphraseForget,
            onPassphraseFocus,
            onPassphraseBlur,
            onPassphraseSave,
            onPassphraseShow,
            onPassphraseHide 
        } = this.props.modalActions;
        const { passphrase, passphraseFocused, passphraseVisible, passphraseCached } = this.props.modal;

        let inputType: string = passphraseVisible || (!passphraseVisible && !passphraseFocused) ? "text" : "password";
        const showPassphraseCheckboxFn: Function = passphraseVisible ? onPassphraseHide : onPassphraseShow;
        const savePassphraseCheckboxFn: Function = passphraseCached ? onPassphraseForget : onPassphraseSave;

        return (
            <div className="passphrase">
                <h3>Please enter your passphrase.</h3>
                <h4>Note that passphrase is case-sensitive.</h4>
                <div>
                    <input
                        ref={ (element) => { this.input = element; } }
                        onChange={ event => onPassphraseChange(event.currentTarget.value) }
                        type={ inputType }
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
                        onFocus={ onPassphraseFocus }
                        onBlur={ onPassphraseBlur }
                        tabIndex="1" />
                </div>
                <div className="passphrase_options">
                    <label>
                        <input type="checkbox" className="show_passphrase" tabIndex="2" onChange={ showPassphraseCheckboxFn } checked={ passphraseVisible } />
                        <span>Show passphrase</span>
                    </label>
                    <label>
                        <input type="checkbox" className="save_passphrase" tabIndex="3" onChange={ savePassphraseCheckboxFn } checked={ passphraseCached } />
                        <span>Save passphrase for current session *</span>
                    </label>
                </div>
                <div>
                    <button type="button" className="submit" tabIndex="4" onClick={ event => onPassphraseSubmit(passphrase, passphraseCached) }>Enter</button>
                </div>
            </div>
        );
    }
}