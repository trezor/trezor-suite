/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as CommonActions from '../../actions/methods/CommonActions';
import * as ResetDeviceActions from '../../actions/methods/ResetDeviceActions';

import CoinSelect from './common/CoinSelect';
import Response from './common/Response';

const ResetDevice = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        label,
        language,
        strength,
        u2fCounter,
        random,
        pinProtection,
        passphraseProtection,
        skipBackup,
        noBackup,
    } = props.state;

    const {
        onFlagChange,
        onResetDevice,
    } = props.methodActions;

    const {
        onTabChange
    } = props.commonActions;

    return (
        <section className="method-content">

            <div className="method-params">

                <div className="row">
                    <label>Label</label>
                    <input type="text" className="small" value={ label } onChange={ event => onFlagChange('label', event.target.value) } />
                </div>

                <div className="row confirmation">
                    <label></label>
                    <label className="custom-checkbox align-left">
                        Pin protection
                        <input type="checkbox" checked={ pinProtection } onChange={ event => onFlagChange('pinProtection', event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                </div>

                <div className="row confirmation">
                    <label></label>
                    <label className="custom-checkbox align-left">
                        Passphrase protection
                        <input type="checkbox" checked={ passphraseProtection } onChange={ event => onFlagChange('passphraseProtection', event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                </div>

                <div className="row confirmation">
                    <label></label>
                    <label className="custom-checkbox align-left">
                        Skip backup
                        <input type="checkbox" checked={ skipBackup } onChange={ event => onFlagChange('skipBackup', event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                </div>

                <div className="row confirmation">
                    <label></label>
                    <label className="custom-checkbox align-left">
                        No backup
                        <input type="checkbox" checked={ noBackup } onChange={ event => onFlagChange('noBackup', event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                </div>

                <div className="row">
                    <label></label>
                    <button onClick={ event => onResetDevice() }>Reset Device</button>
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
            state: state.resetdevice,
        };
    },
    (dispatch: Dispatch) => {
        return {
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(ResetDeviceActions, dispatch),
        };
    }
)(ResetDevice);