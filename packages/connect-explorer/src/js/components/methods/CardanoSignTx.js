/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as CardanoSignTxActions from '../../actions/methods/CardanoSignTxActions';

import Response from './common/Response';

const CardanoSignTx = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        network,
        inputs,
        outputs,
        transactions,
    } = props.state;

    const {
        onSignTx,
        onNetworkChange,
        onInputsChange,
        onOutputsChange,
        onTransactionsChange
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    return (
        <section className="method-content">

            <div className="method-params">

                <div className="row">
                    <label>Network</label>
                    <input type="text" className="small" value={ network } onChange={ event => onNetworkChange(event.target.value) } />
                </div>

                <div className="row">
                    <label>Inputs</label>
                    <textarea value={ inputs } onChange={ event => onInputsChange(event.target.value) }></textarea>
                </div>

                <div className="row">
                    <label>Outputs</label>
                    <textarea value={ outputs } onChange={ event => onOutputsChange(event.target.value) }></textarea>
                </div>

                <div className="transaction-json">
                    <label>Transactions</label>
                    <textarea onChange={ event => onTransactionsChange(event.target.value) } value={ transactions }></textarea>
                </div>

                <div className="row">
                    <label></label>
                    <button onClick={ event => onSignTx() }>Sign Cardano transaction</button>
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
            state: state.cardanosigntx,
        };
    },
    (dispatch: Dispatch) => {
        return {
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(CardanoSignTxActions, dispatch),
        };
    }
)(CardanoSignTx);