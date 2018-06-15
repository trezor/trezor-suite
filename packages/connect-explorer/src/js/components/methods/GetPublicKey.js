/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as CommonActions from '../../actions/methods/CommonActions';
import * as GetXpubActions from '../../actions/methods/GetXpubActions';

import CoinSelect from './common/CoinSelect';
import Response from './common/Response';

const GetPublicKey = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        coin,
        path,
    } = props.state;

    const { 
        onCoinChange,
        onPathChange,
        onGetXpub
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

                <CoinSelect 
                    coin={ coin }
                    onCoinChange={ onCoinChange } />

                <div className="row">
                    <label></label>
                    <button onClick={ event => onGetXpub(params) }>Get public key</button>
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
            state: state.getxpub,
        };
    },
    (dispatch: Dispatch) => {
        return { 
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(GetXpubActions, dispatch),
        };
    }
)(GetPublicKey);