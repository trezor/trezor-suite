/* @flow */


import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { CSSTransition, Transition } from 'react-transition-group';

import { UI } from 'trezor-connect';

import { default as ModalActions } from 'actions/ModalActions';
import { default as ReceiveActions } from 'actions/ReceiveActions';

import * as RECEIVE from 'actions/constants/receive';
import * as MODAL from 'actions/constants/modal';
import * as CONNECT from 'actions/constants/TrezorConnect';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';

import ForgetDevice from 'components/modal/ForgetDevice';

import Pin from 'components/modal/Pin';
import InvalidPin from 'components/modal/InvalidPin';
import Passphrase from 'components/modal/Passphrase';
import PassphraseType from 'components/modal/PassphraseType';
import ConfirmSignTx from 'components/modal/ConfirmSignTx';
import ConfirmAddress, { ConfirmUnverifiedAddress } from 'components/modal/ConfirmAddress';
import RememberDevice from 'components/modal/RememberDevice';
import DuplicateDevice from 'components/modal/DuplicateDevice';


type OwnProps = { }

type StateProps = {
    modal: $ElementType<State, 'modal'>,
    accounts: $ElementType<State, 'accounts'>,
    devices: $ElementType<State, 'devices'>,
    connect: $ElementType<State, 'connect'>,
    selectedAccount: $ElementType<State, 'selectedAccount'>,
    sendForm: $ElementType<State, 'sendForm'>,
    receive: $ElementType<State, 'receive'>,
    localStorage: $ElementType<State, 'localStorage'>,
    wallet: $ElementType<State, 'wallet'>,
}

type DispatchProps = {
    modalActions: typeof ModalActions,
    receiveActions: typeof ReceiveActions,
}

export type Props = StateProps & DispatchProps;

const duration = 300;


const Fade = ({ children, ...props }) => (
    <CSSTransition
        {...props}
        timeout={1000}
        classNames="fade"
    >
        { children }
    </CSSTransition>
);

class Modal extends Component<Props> {
    render() {
        if (!this.props.modal.opened) return null;

        const { opened, windowType } = this.props.modal;

        let component = null;
        switch (windowType) {
            case UI.REQUEST_PIN:
                component = (<Pin {...this.props} />);
                break;
            case UI.INVALID_PIN:
                component = (<InvalidPin {...this.props} />);
                break;
            case UI.REQUEST_PASSPHRASE:
                component = (<Passphrase {...this.props} />);
                break;
            case 'ButtonRequest_SignTx':
                component = (<ConfirmSignTx {...this.props} />);
                break;
            // case "ButtonRequest_Address" :
            //     component = (<ConfirmAddress { ...this.props } />)
            // break;
            case 'ButtonRequest_PassphraseType':
                component = (<PassphraseType {...this.props} />);
                break;
            case RECEIVE.REQUEST_UNVERIFIED:
                component = (<ConfirmUnverifiedAddress {...this.props} />);
                break;

            case CONNECT.REMEMBER_REQUEST:
                component = (<RememberDevice {...this.props} />);
                break;

            case CONNECT.FORGET_REQUEST:
                component = (<ForgetDevice {...this.props} />);
                break;

            case CONNECT.TRY_TO_DUPLICATE:
                component = (<DuplicateDevice {...this.props} />);
                break;

            default: null;
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

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State, own: OwnProps): StateProps => ({
    modal: state.modal,
    accounts: state.accounts,
    devices: state.devices,
    connect: state.connect,
    selectedAccount: state.selectedAccount,
    sendForm: state.sendForm,
    receive: state.receive,
    localStorage: state.localStorage,
    wallet: state.wallet,
});

const mapDispatchToProps: MapDispatchToProps<Dispatch, OwnProps, DispatchProps> = (dispatch: Dispatch): DispatchProps => ({
    modalActions: bindActionCreators(ModalActions, dispatch),
    receiveActions: bindActionCreators(ReceiveActions, dispatch),
});

// export default connect(mapStateToProps, mapDispatchToProps)(Modal);
export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(Modal),
);
