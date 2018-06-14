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
        customFuction,
    } = props.state;

    const {
        onCustomMessage,
        onFnChange
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    return (
        <section className="method-content">

            <div className="method-params">

                <div className="transaction-json">
                    <label>Function</label>
                    <textarea onChange={ event => onFnChange(event.target.value) } value={ customFuction }>
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