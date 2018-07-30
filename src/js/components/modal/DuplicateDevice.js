/* @flow */


import React, { Component } from 'react';
import { getNewInstance } from '~/js/reducers/DevicesReducer';
import type { Props } from './index';

type State = {
    defaultName: string;
    instance: number;
    instanceName: ?string;
    isUsed: boolean;
}

export default class DuplicateDevice extends Component<Props, State> {
    keyboardHandler: (event: KeyboardEvent) => void;

    state: State;

    input: ?HTMLInputElement;

    constructor(props: Props) {
        super(props);

        const device = props.modal.opened ? props.modal.device : null;
        if (!device) return;

        const instance = getNewInstance(props.devices, device);

        this.state = {
            defaultName: `${device.label} (${instance.toString()})`,
            instance,
            instanceName: null,
            isUsed: false,
        };
    }

    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13 && !this.state.isUsed) {
            event.preventDefault();
            this.submit();
        }
    }

    componentDidMount(): void {
        // one time autofocus
        if (this.input) this.input.focus();
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    onNameChange = (value: string): void => {
        let isUsed: boolean = false;
        if (value.length > 0) {
            isUsed = (this.props.devices.find(d => d.instanceName === value) !== undefined);
        }

        this.setState({
            instanceName: value.length > 0 ? value : null,
            isUsed,
        });
    }

    submit() {
        if (!this.props.modal.opened) return;
        this.props.modalActions.onDuplicateDevice({ ...this.props.modal.device, instanceName: this.state.instanceName, instance: this.state.instance });
    }

    render() {
        if (!this.props.modal.opened) return null;

        const { device } = this.props.modal;
        const { onCancel, onDuplicateDevice } = this.props.modalActions;
        const {
            defaultName,
            instanceName,
            isUsed,
        } = this.state;

        return (
            <div className="duplicate">
                <button className="close-modal transparent" onClick={onCancel} />
                <h3>Clone { device.label }?</h3>
                <p>This will create new instance of device which can be used with different passphrase</p>
                <div className="row">
                    <label>Instance name</label>
                    <input
                        type="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        className={isUsed ? 'not-valid' : null}
                        placeholder={defaultName}
                        ref={(element) => { this.input = element; }}
                        onChange={event => this.onNameChange(event.currentTarget.value)}
                        defaultValue={instanceName}
                    />
                    { isUsed ? <span className="error">Instance name is already in use</span> : null }
                </div>
                <button disabled={isUsed} onClick={event => this.submit()}>Create new instance</button>
                <button className="white" onClick={onCancel}>Cancel</button>
            </div>
        );
    }
}