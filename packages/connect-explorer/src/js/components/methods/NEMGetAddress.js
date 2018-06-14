/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as NEMGetAddressActions from '../../actions/methods/NEMGetAddressActions';

import Response from './common/Response';

const NEMGetAddress = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        path,
        network,
        showOnTrezor,
    } = props.state;

    const {
        onGetAddress,
        onNetworkChange,
        onPathChange,
        onConfirmationChange
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    return (
        <section className="method-content">

            <div className="method-params">

                <div className="type-path">
                    <div className="row">
                        <label>Network</label>
                        <select value={ network } onChange={ event => onNetworkChange(event.target.value) }>
                            <option value="104">Mainnet</option>
                            <option value="152">Testnet</option>
                            <option value="96">Mijin</option>
                        </select>
                    </div>
                </div>

                <div className="type-path">
                    <div className="row">
                        <label>Path</label>
                        <input type="text" className="small" value={ path } onChange={ event => onPathChange(event.target.value) } />
                    </div>
                </div>

                

                <div className="row confirmation">
                    <label></label>
                    <label className="custom-checkbox align-left">
                        Show on TREZOR
                        <input type="checkbox" checked={ showOnTrezor } onChange={ event => onConfirmationChange(event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                </div>

                <div className="row">
                    <label></label>
                    <button onClick={ event => onGetAddress() }>Get NEM address</button>
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
            state: state.nemgetaddress,
        };
    },
    (dispatch: Dispatch) => {
        return {
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(NEMGetAddressActions, dispatch),
        };
    }
)(NEMGetAddress);