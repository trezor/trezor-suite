/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as NEMSignTxActions from '../../actions/methods/NEMSignTxActions';

import Response from './common/Response';

const NEMSignTx = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        path,
        transaction,
    } = props.state;

    const {
        onSignTx,
        onPathChange,
        onTransactionChange
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    return (
        <section className="method-content">

            <div className="method-params">

                <div className="type-path">
                    <div className="row">
                        <label>Path</label>
                        <input type="text" className="small" value={ path } onChange={ event => onPathChange(event.target.value) } />
                    </div>
                </div>

                <div className="transaction-json">
                    <label>Transaction JSON</label>
                    <textarea onChange={ event => onTransactionChange(event.target.value) } value={ transaction }>
                    </textarea>
                </div>

                <div className="row">
                    <label></label>
                    <button onClick={ event => onSignTx() }>Sign NEM transaction</button>
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
            state: state.nemsigntx,
        };
    },
    (dispatch: Dispatch) => {
        return {
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(NEMSignTxActions, dispatch),
        };
    }
)(NEMSignTx);