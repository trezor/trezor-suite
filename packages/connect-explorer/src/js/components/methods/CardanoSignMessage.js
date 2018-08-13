/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as CardanoMessageActions from '../../actions/methods/CardanoMessageActions';

import Response from './common/Response';

const CardanoSignMessage = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        path,
        message,
    } = props.state;

    const {
        onPathChange,
        onMessageChange,
        onSignMessage,
        verifyResponseValues
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    let verifyResponse = null;
    if (response && response.success) {
        verifyResponse = (<button onClick={ event => verifyResponseValues(response) }>Verify response values</button>)
    }

    return (
        <section className="method-content">

            <div className="method-params">

                <div className="row">
                    <label>Path</label>
                    <input type="text" className="small" value={ path } onChange={ event => onPathChange(event.target.value) } />
                </div>
                <div className="row">
                    <label>Message</label>
                    <textarea onChange={ event => onMessageChange(event.target.value) } value={ message }>
                    </textarea>
                </div>
                <div className="row">
                    <label></label>
                    <button onClick={ event => onSignMessage() }>Sign message</button>
                    { verifyResponse }
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
            state: state.cardanosignmessage,
        };
    },
    (dispatch: Dispatch) => {
        return {
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(CardanoMessageActions, dispatch),
        };
    }
)(CardanoSignMessage);