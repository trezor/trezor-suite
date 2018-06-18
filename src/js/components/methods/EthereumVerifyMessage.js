/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as EthereumMessageActions from '../../actions/methods/EthereumMessageActions';

import Response from './common/Response';

const EthereumVerifyMessage = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        address,
        message,
        signature,
    } = props.state;

    const {
        onPathChange,
        onMessageChange,
        onSignatureChange,
        onVerifyMessage
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    return (
        <section className="method-content">

            <div className="method-params">

                <div className="row">
                    <label>Address</label>
                    <input type="text" value={ address } onChange={ event => onPathChange(event.target.value) } />
                </div>

                <div className="row">
                    <label>Message</label>
                    <textarea onChange={ event => onMessageChange(event.target.value) } value={ message }>
                    </textarea>
                </div>

                <div className="row">
                    <label>Signature</label>
                    <textarea onChange={ event => onSignatureChange(event.target.value) } value={ signature }>
                    </textarea>
                </div>

                <div className="row">
                    <label></label>
                    <button onClick={ event => onVerifyMessage() }>Verify message</button>
                </div>

            </div>

            <Response 
                response={ response }
                code={ code }
                tab={ tab }
                onTabChange={ onTabChange } />

        </section>
    );
}

export default connect( 
    (state: State) => {
        return {
            common: state.common,
            state: state.ethverifymessage,
        };
    },
    (dispatch: Dispatch) => {
        return {
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(EthereumMessageActions, dispatch),
        };
    }
)(EthereumVerifyMessage);