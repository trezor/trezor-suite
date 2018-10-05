/* @flow */
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import styled from 'styled-components';
import colors from 'config/colors';
import { CSSTransition } from 'react-transition-group';

import { UI } from 'trezor-connect';

import ModalActions from 'actions/ModalActions';
import ReceiveActions from 'actions/ReceiveActions';

import * as RECEIVE from 'actions/constants/receive';
import * as CONNECT from 'actions/constants/TrezorConnect';
import type { MapStateToProps, MapDispatchToProps } from 'react-redux';
import type { State, Dispatch } from 'flowtype';

import Pin from 'components/modals/pin/Pin';
import InvalidPin from 'components/modals/pin/Invalid';

import Passphrase from 'components/modals/passphrase/Passphrase';
import PassphraseType from 'components/modals/passphrase/Type';

import ConfirmSignTx from 'components/modals/confirm/SignTx';
import ConfirmUnverifiedAddress from 'components/modals/confirm/UnverifiedAddress';

import ForgetDevice from 'components/modals/device/Forget';
import RememberDevice from 'components/modals/device/Remember';
import DuplicateDevice from 'components/modals/device/Duplicate';
import RequestWalletType from 'components/modals/device/Type';

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

const Fade = ({ children, ...props }) => (
    <CSSTransition
        {...props}
        timeout={1000}
        classNames="fade"
    >
        { children }
    </CSSTransition>
);

const ModalContainer = styled.div`
    position: fixed;
    z-index: 10000;
    width: 100%;
    height: 100%;
    top: 0px;
    left: 0px;
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    padding: 20px;
`;

const ModalWindow = styled.div`
    margin: auto;
    position: relative;
    border-radius: 4px;
    background-color: ${colors.WHITE};
    text-align: center;
`;

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

            case CONNECT.REQUEST_WALLET_TYPE:
                component = (<RequestWalletType {...this.props} />);
                break;

            default:
                component = null;
        }

        let ch = null;
        if (opened) {
            ch = (
                <Fade key="1">
                    <ModalContainer>
                        <ModalWindow>
                            { component }
                        </ModalWindow>
                    </ModalContainer>
                </Fade>
            );
        }

        return ch;
    }
}

const mapStateToProps: MapStateToProps<State, OwnProps, StateProps> = (state: State): StateProps => ({
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
