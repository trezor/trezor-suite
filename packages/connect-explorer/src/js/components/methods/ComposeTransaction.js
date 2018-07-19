/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as ComposeTxActions from '../../actions/methods/ComposeTxActions';

import CoinSelect from './common/CoinSelect';
import Response from './common/Response';

const ComposeTransaction = (props: Props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        coin,
        outputs,
        locktimeEnabled,
        locktime,
        push,
    } = props.state;

    const { 
        onCoinChange,
        onOutputsChange,
        onLocktimeEnable,
        onLocktimeChange,
        onPushChange,
        onComposeTx
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
                    <label>Outputs</label>
                    <textarea onChange={ event => onOutputsChange(event.target.value) } value={ outputs }>
                    </textarea>
                </div>

                {/* <div className="row">
                    <label className="custom-checkbox">
                        Locktime
                        <input type="checkbox" value={ locktimeEnabled } onChange={ event => onLocktimeEnable(event.target.checked) }/>
                        <span className="indicator"></span>
                    </label>
                    <input type="text" className="locktime small" value={ locktime } disabled={ locktimeEnabled ? '' : 'disabled' } onChange={ event => onLocktimeChange(event.currentTarget.value) } />
                </div> */}

                <div className="row">
                    <label className="custom-checkbox">
                        Push
                        <input type="checkbox" value={ push } onChange={ event => onPushChange(event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                    <button onClick={ event => onComposeTx(params) }>Compose transaction</button>
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
            state: state.composetx,
        };
    },
    (dispatch: Dispatch) => {
        return { 
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(ComposeTxActions, dispatch),
        };
    }
)(ComposeTransaction);