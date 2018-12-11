/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as WipeDeviceActions from '../../actions/methods/WipeDeviceActions';

import CoinSelect from './common/CoinSelect';
import Response from './common/Response';

const WipeDevice = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        onWipeDevice,
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    return (
        <section className="method-content">

            <div className="method-params">

                <div className="row">
                    <label></label>
                    <button onClick={ event => onWipeDevice() }>Wipe Device</button>
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
            state: state.wipedevice,
        };
    },
    (dispatch: Dispatch) => {
        return {
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(WipeDeviceActions, dispatch),
        };
    }
)(WipeDevice);