/* @flow */
'use strict';

import React, { Component } from 'react';
import { CSSTransition, Transition } from 'react-transition-group';

import { UI } from 'trezor-connect';

import Pin from './Pin';
import InvalidPin from './InvalidPin';
import Passphrase from './Passphrase';
import Permission from './Permission';
import Confirmation from './Confirmation';

import AccountSelection from './AccountSelection';
import FeeSelection from './FeeSelection';

const duration = 300;

const defaultStyle = {
  transition: `opacity ${duration}ms ease-in-out`,
  opacity: 0,
  padding: 20,
  display: 'inline-block',
  backgroundColor: '#8787d8'
}

const transitionStyles = {
  entering: { opacity: 0 },
  entered: { opacity: 1 },
};

const Fade2 = ({ in: inProp }) => (
    <Transition in={inProp} timeout={duration}>
        {(state) => (
            <div style={{
                ...defaultStyle,
                ...transitionStyles[state]
            }}>
                I'm A fade Transition2
            </div>
        )}
    </Transition>
);

const Fade = ({ children, ...props }) => (
    <CSSTransition
        { ...props }
        timeout={ 1000 }
        classNames="fade">
            { children }
    </CSSTransition>
);

export default class Modal extends Component {
    render() {
        const { opened, windowType } = this.props.modal;

        let component = null;
        switch(windowType) {
            case UI.REQUEST_PIN :
                component = (<Pin { ...this.props } />);
            break;
            case UI.INVALID_PIN :
                component = (<InvalidPin />);
            break;
            case UI.REQUEST_PASSPHRASE :
                component = (<Passphrase { ...this.props } />);
            break;
            case UI.REQUEST_PERMISSION :
                component = (<Permission { ...this.props } />);
            break;
            case UI.REQUEST_CONFIRMATION :
                component = (<Confirmation { ...this.props } />);
            break;

            case UI.SELECT_ACCOUNT :
                component = (<AccountSelection { ...this.props } />);
            break;
            case UI.SELECT_FEE :
                component = (<FeeSelection { ...this.props } />);
            break;
        }

        let ch = null;
        if (opened) {
            ch = (
                <Fade key="1">
                    <div className="modal-container">
                        { component && (
                            <div className="modal-window">
                                { component }
                            </div>
                        )}
                    </div>
                </Fade>
            );
        }

        return ch;
    }
}
