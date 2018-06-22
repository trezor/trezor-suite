/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as CommonActions from '../../actions/methods/CommonActions';
import * as GetAccountInfoActions from '../../actions/methods/GetAccountInfoActions';

import CoinSelect from './common/CoinSelect';
import Response from './common/Response';

const GetAccountInfo = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        path,
        coin
    } = props.state;

    const { 
        onPathChange,
        onCoinChange,
        onGetAccountInfo
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    return (
        <section className="method-content">

            <div className="method-params">
                <div className="row">
                    <label>Path or xpub</label>
                    <input type="text" className="small" value={ path } onChange={ event => onPathChange(event.target.value) } />
                </div>

                <CoinSelect 
                    obligatory={ true }
                    coin={ coin }
                    onCoinChange={ onCoinChange } />

                <div className="row">
                    <label></label>
                    <button onClick={ event => onGetAccountInfo() }>Get account info</button>
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
            state: state.getaccountinfo,
        };
    },
    (dispatch: Dispatch) => {
        return { 
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(GetAccountInfoActions, dispatch),
        };
    }
)(GetAccountInfo);