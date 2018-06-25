/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as CommonActions from '../../actions/methods/CommonActions';
import * as RequestLoginActions from '../../actions/methods/RequestLoginActions';

import CoinSelect from './common/CoinSelect';
import Response from './common/Response';

const RequestLogin = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        identity,
        challengeHidden,
        challengeVisual,
        callback
    } = props.state;

    const { 
        onIdentityChange,
        onHiddenChange,
        onVisualChange,
        onCallbackChange,
        onLogin
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    return (
        <section className="method-content">

            <div className="method-params">

                <div className="row">
                    <label>Identity</label>
                    <textarea onChange={ event => onIdentityChange(event.target.value) } value={ identity } style={{ height: '110px' }}>
                    </textarea>
                </div>

                <div className="row">
                    <label>Challenge hidden</label>
                    <input type="text" onChange={ event => onHiddenChange(event.target.value) } value={ challengeHidden } />
                </div>

                <div className="row">
                    <label>Challenge visual</label>
                    <input type="text" onChange={ event => onVisualChange(event.target.value) } value={ challengeVisual } />
                </div>

                <div className="row">
                    <label>Callback</label>
                    <textarea onChange={ event => onCallbackChange(event.target.value) } value={ callback } style={{ height: '110px' }}>
                    </textarea>
                </div>

                <div className="row">
                    <label></label>
                    <button onClick={ event => onLogin() }>Login</button>
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
            state: state.login,
        };
    },
    (dispatch: Dispatch) => {
        return { 
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(RequestLoginActions, dispatch),
        };
    }
)(RequestLogin);