import React, { Component, KeyboardEvent, FocusEvent } from 'react';
import { Button, Checkbox } from '@trezor/components';

export default class PinModal extends Component {
    input: HTMLInputElement;

    componentDidMount() {
        // one time autofocus
        this.input.focus();
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
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

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    keyboardHandler(event: KeyboardEvent) {
        const { onPassphraseSubmit } = this.props;
        const { passphrase, passphraseCached } = this.props.modal;

        if (event.keyCode === 13) {
            event.preventDefault();
            this.input.blur();
            onPassphraseSubmit(passphrase, passphraseCached);
        }
    }

    render() {
        const {
            onPassphraseChange,
            onPassphraseSubmit,
            onPassphraseForget,
            onPassphraseFocus,
            onPassphraseBlur,
            onPassphraseSave,
            onPassphraseShow,
            onPassphraseHide,
        } = this.props.modalActions;
        const {
            passphrase,
            passphraseFocused,
            passphraseVisible,
            passphraseCached,
        } = this.props.modal;

        const inputType: string =
            passphraseVisible || (!passphraseVisible && !passphraseFocused) ? 'text' : 'password';
        const showPassphraseCheckboxFn: Function = passphraseVisible
            ? onPassphraseHide
            : onPassphraseShow;
        const savePassphraseCheckboxFn: Function = passphraseCached
            ? onPassphraseForget
            : onPassphraseSave;

        return (
            <div className="passphrase">
                <h3>Please enter your passphrase.</h3>
                <h4>Note that passphrase is case-sensitive.</h4>
                <div>
                    <input
                        ref={element => {
                            this.input = element;
                        }}
                        onChange={event => onPassphraseChange(event.currentTarget.value)}
                        type={inputType}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        data-lpignore="true"
                        onFocus={onPassphraseFocus}
                        onBlur={onPassphraseBlur}
                    />
                </div>
                <div className="passphrase_options">
                    <Checkbox isChecked={passphraseVisible} onClick={showPassphraseCheckboxFn}>
                        <span>Show passphrase</span>
                    </Checkbox>
                    <Checkbox isChecked={passphraseCached} onClick={savePassphraseCheckboxFn}>
                        <span>Save passphrase for current session *</span>
                    </Checkbox>
                </div>
                <div>
                    <Button onClick={event => onPassphraseSubmit(passphrase, passphraseCached)}>
                        Enter
                    </Button>
                </div>
            </div>
        );
    }
}
