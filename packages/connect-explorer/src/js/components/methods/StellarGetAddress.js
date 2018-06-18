/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as StellarGetAddressActions from '../../actions/methods/StellarGetAddressActions';

import Response from './common/Response';

const StellarGetAddress = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        path,
        showOnTrezor,
    } = props.state;

    const {
        onGetAddress,
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
            state: state.stellargetaddress,
        };
    },
    (dispatch: Dispatch) => {
        return {
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(StellarGetAddressActions, dispatch),
        };
    }
)(StellarGetAddress);