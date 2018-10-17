/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as TezosSignTxActions from '../../actions/methods/TezosSignTxActions';

import Response from './common/Response';

const TezosSignTx = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        path,
        branch,
        operation,
    } = props.state;

    const {
        onSignTx,
        onPathChange,
        onBranchChange,
        onOperationChange
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    return (
        <section className="method-content">

            <div className="method-params">

                <div className="row">
                    <label>Path</label>
                    <input type="text" className="small" value={ path } onChange={ event => onPathChange(event.target.value) } />
                </div>

                <div className="row">
                    <label>Branch</label>
                    <input type="text" value={ branch } onChange={ event => onBranchChange(event.target.value) } />
                </div>

                <div className="transaction-json">
                    <label>Operation</label>
                    <textarea onChange={ event => onOperationChange(event.target.value) } value={ operation }>
                    </textarea>
                </div>

                <div className="row">
                    <label></label>
                    <button onClick={ event => onSignTx() }>Sign Tezos transaction</button>
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
            state: state.tezossigntx,
        };
    },
    (dispatch: Dispatch) => {
        return {
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(TezosSignTxActions, dispatch),
        };
    }
)(TezosSignTx);