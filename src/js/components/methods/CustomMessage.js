/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as CustomMessageActions from '../../actions/methods/CustomMessageActions';

import Response from './common/Response';

const CustomMessage = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        messages,
        message,
        callback,
    } = props.state;

    const {
        onMessagesChange,
        onMessageChange,
        onParamsChange,
        onCallbackChange,
        onCustomMessage,
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    return (
        <section className="method-content">

            <div className="method-params">

                <div className="row">
                    <label>Messages definitions</label>
                    <textarea onChange={ event => onMessagesChange(event.target.value) } value={ messages }  style={{ height: '80px' }}>
                    </textarea>
                </div>

                <div className="row">
                    <label>Message</label>
                    <input type="text" onChange={ event => onMessageChange(event.target.value) } value={ message } />
                </div>

                <div className="row">
                    <label>Params</label>
                    <textarea onChange={ event => onParamsChange(event.target.value) } value={ props.state.params }  style={{ height: '80px' }}>
                    </textarea>
                </div>

                <div className="transaction-json">
                    <label>Request handler</label>
                    <textarea onChange={ event => onCallbackChange(event.target.value) } value={ callback }>
                    </textarea>
                </div>

                <div className="row">
                    <label></label>
                    <button onClick={ event => onCustomMessage() }>CALL</button>
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
            state: state.custom,
        };
    },
    (dispatch: Dispatch) => {
        return {
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(CustomMessageActions, dispatch),
        };
    }
)(CustomMessage);