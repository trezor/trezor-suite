/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as PushTxActions from '../../actions/methods/PushTxActions';

import CoinSelect from './common/CoinSelect';
import Response from './common/Response';

const PushTx = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        coin,
        tx,
    } = props.state;

    const {
        onPushTx,
        onCoinChange,
        onTxChange
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    return (
        <section className="method-content">

            <div className="method-params">

                <CoinSelect 
                    obligatory={ true }
                    coin={ coin }
                    onCoinChange={ onCoinChange } />

                <div className="transaction-json">
                    <label>Transaction HEX</label>
                    <textarea onChange={ event => onTxChange(event.target.value) } value={ tx }>
                    </textarea>
                </div>

                <div className="row">
                    <label></label>
                    <button onClick={ event => onPushTx() }>Push transaction</button>
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
            state: state.pushtx,
        };
    },
    (dispatch: Dispatch) => {
        return {
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(PushTxActions, dispatch),
        };
    }
)(PushTx);