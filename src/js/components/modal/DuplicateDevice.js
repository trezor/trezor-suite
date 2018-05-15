/* @flow */
'use strict';

import React, { Component } from 'react';
import { getNewInstance } from '../../reducers/TrezorConnectReducer'
import type { Props } from './index';

type State = {
    defaultName: string;
    instanceName: ?string;
}

export default class DuplicateDevice extends Component<Props, State> {

    keyboardHandler: (event: KeyboardEvent) => void;
    state: State;

    constructor(props: Props) {
        super(props);

        const device = props.modal.opened ? props.modal.device : null;
        if (!device) return;

        const instance = getNewInstance(props.connect.devices, device);

        this.state = {
            defaultName: `${device.label} (${instance.toString()})`,
            instanceName: null
        }
    }

    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.submit();
        }
    }

    componentDidMount(): void {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    onNameChange = (value: string): void => {
        this.setState({
            instanceName: value.length > 0 ? value : null
        });
    }

    submit() {
        if (this.props.modal.opened) {
            this.props.modalActions.onDuplicateDevice( { ...this.props.modal.device, instanceName: this.state.instanceName } );
        }
    }

    render() {
    
        if (!this.props.modal.opened) return null;

        const { device } = this.props.modal;
        const { onCancel, onDuplicateDevice } = this.props.modalActions;

        return (
            <div className="duplicate">
                <h3>Clone { device.label }?</h3>
                <p>This will create new instance of device which can be used with different passphrase</p>
                <label>Instance name</label>
                <input 
                    type="text" 
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    placeholder={ this.state.defaultName }
                    onChange={ event => this.onNameChange(event.currentTarget.value) }
                    defaultValue={ this.state.instanceName } />
                <button onClick={ event => this.submit() }>Create new instance</button>
                <button className="white" onClick={ onCancel }>Cancel</button>
            </div>
        );
    }
}