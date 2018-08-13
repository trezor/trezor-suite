/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as CardanoMessageActions from '../../actions/methods/CardanoMessageActions';

import Response from './common/Response';

const CardanoVerifyMessage = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        publicKey,
        message,
        signature,
    } = props.state;

    const {
        onPublicKeyChange,
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
                    <label>Public key</label>
                    <input type="text" value={ publicKey } onChange={ event => onPublicKeyChange(event.target.value) } />
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
            state: state.cardanoverifymessage,
        };
    },
    (dispatch: Dispatch) => {
        return {
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(CardanoMessageActions, dispatch),
        };
    }
)(CardanoVerifyMessage);