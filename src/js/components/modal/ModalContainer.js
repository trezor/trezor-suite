/* @flow */
'use strict';

import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { CSSTransition, Transition } from 'react-transition-group';

import { UI } from 'trezor-connect';

import * as ModalActions from '../../actions/ModalActions';
import * as ReceiveActions from '../../actions/ReceiveActions';

import Pin from './Pin';
import InvalidPin from './InvalidPin';
import Passphrase from './Passphrase';
import ConfirmSignTx from './ConfirmSignTx';
import ConfirmAddress, { ConfirmUnverifiedAddress } from './ConfirmAddress';
import RememberDevice, { ForgetDevice, DisconnectDevice } from './RememberDevice';
import DuplicateDevice from './DuplicateDevice';

import * as RECEIVE from '../../actions/constants/receive';
import * as MODAL from '../../actions/constants/Modal';
import * as CONNECT from '../../actions/constants/TrezorConnect';

const duration = 300;


const Fade = ({ children, ...props }) => (
    <CSSTransition
        { ...props }
        timeout={ 1000 }
        classNames="fade">
            { children }
    </CSSTransition>
);

class Modal extends Component {
    render() {
        const { opened, windowType } = this.props.modal;

        let component = null;
        switch (windowType) {
            case UI.REQUEST_PIN :
                component = (<Pin { ...this.props } />);
            break;
            case UI.INVALID_PIN :
                component = (<InvalidPin { ...this.props } />);
            break;
            case UI.REQUEST_PASSPHRASE :
                component = (<Passphrase { ...this.props } />);
            break;
            case "ButtonRequest_SignTx" :
                component = (<ConfirmSignTx { ...this.props } />)
            break;
            case "ButtonRequest_Address" :
                component = (<ConfirmAddress { ...this.props } />)
            break;
            case RECEIVE.REQUEST_UNVERIFIED :
                component = (<ConfirmUnverifiedAddress { ...this.props } />)
            break;

            case CONNECT.REMEMBER_REQUEST :
                component = (<RememberDevice { ...this.props } />)
            break;

            case CONNECT.FORGET_REQUEST :
                component = (<ForgetDevice { ...this.props } />)
            break;

            case CONNECT.DISCONNECT_REQUEST :
                component = (<DisconnectDevice { ...this.props } />)
            break;

            case CONNECT.TRY_TO_DUPLICATE :
                component = (<DuplicateDevice { ...this.props } />)
            break;
        }

        let ch = null;
        if (opened) {
            ch = (
                <Fade key="1">
                    <div className="modal-container">
                        <div className="modal-window">
                            { component }
                        </div>
                    </div>
                </Fade>
            );
        }

        return ch;
    }
}

const mapStateToProps = (state: any, own: any): any => {
    return {
        modal: state.modal,
        accounts: state.accounts,
        devices: state.connect.devices,
        sendForm: state.sendForm,
        receive: state.receive,
    };
}

const mapDispatchToProps = (dispatch: any): any => {
    return {
        modalActions: bindActionCreators(ModalActions, dispatch),
        receiveActions: bindActionCreators(ReceiveActions, dispatch),
    };
}

// export default connect(mapStateToProps, mapDispatchToProps)(Modal);
export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(Modal)
);
