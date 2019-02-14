/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as CommonActions from '../../actions/methods/CommonActions';
import * as GetAddressActions from '../../actions/methods/GetAddressActions';

import CoinSelect from './common/CoinSelect';
import Response from './common/Response';

const GetAddress = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        path,
        address,
        addressValidation,
        coin,
        showOnTrezor
    } = props.state;

    const { 
        onPathChange,
        onAddressChange,
        onCoinChange,
        onConfirmationChange,
        onGetAddress
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    const validationClassName = addressValidation ? 'row validated' : 'row';

    return (
        <section className="method-content">

            <div className="method-params">
                <div className="row">
                    <label>Path</label>
                    <input type="text" className="small" value={ path } onChange={ event => onPathChange(event.target.value) } />
                </div>

                <CoinSelect 
                    coin={ coin }
                    onCoinChange={ onCoinChange } />

                <div className="row confirmation">
                    <label></label>
                    <label className="custom-checkbox align-left">
                        Show on TREZOR
                        <input type="checkbox" checked={ showOnTrezor } onChange={ event => onConfirmationChange(event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                </div>

                <div className={ validationClassName }>
                    <label>Address validation</label>
                    <input type="text" value={ address } onChange={ event => onAddressChange(event.target.value) } />
                </div>

                <div className="row">
                    <label></label>
                    <button onClick={ event => onGetAddress() }>Get address</button>
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
            state: state.getaddress,
        };
    },
    (dispatch: Dispatch) => {
        return { 
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(GetAddressActions, dispatch),
        };
    }
)(GetAddress);