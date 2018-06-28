/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as SignTxActions from '../../actions/methods/SignTxActions';

import CoinSelect from './common/CoinSelect';
import Response from './common/Response';

const SignTransaction = (props: Props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        coin,
        inputs,
        outputs,
        push,
    } = props.state;

    const { 
        onCoinChange,
        onInputsChange,
        onOutputsChange,
        onPushChange,
        onSignTransaction
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
                    <label>Inputs</label>
                    <textarea onChange={ event => onInputsChange(event.target.value) } value={ inputs }>
                    </textarea>
                </div>

                <div className="transaction-json">
                    <label>Outputs</label>
                    <textarea onChange={ event => onOutputsChange(event.target.value) } value={ outputs }>
                    </textarea>
                </div>

                <div className="row">
                    <label className="custom-checkbox">
                        Push
                        <input type="checkbox" value={ push } onChange={ event => onPushChange(event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                    <button onClick={ event => onSignTransaction() }>Sign transaction</button>
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
            state: state.signtx,
        };
    },
    (dispatch: Dispatch) => {
        return { 
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(SignTxActions, dispatch),
        };
    }
)(SignTransaction);