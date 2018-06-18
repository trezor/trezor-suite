/* @flow */
'use strict';

import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as CommonActions from '../../actions/methods/CommonActions';
import * as CipherKeyValueActions from '../../actions/methods/CipherKeyValueActions';

import Response from './common/Response';

const CipherKeyValue = (props): any => {

    const {
        response,
        tab,
        code,
        params,
    } = props.common;

    const {
        path,
        key,
        value,
        encrypt,
        askOnEncrypt,
        askOnDecrypt,
        iv
    } = props.state;

    const { 
        onPathChange,
        onKeyChange,
        onValueChange,
        onEncryptChange,
        onAskOnEncryptChange,
        onAskOnDecryptChange,
        onIVChange,
        onCipherKeyValue
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

                <div className="type-path">
                    <div className="row">
                        <label>Key</label>
                        <input type="text" className="small" value={ key } onChange={ event => onKeyChange(event.target.value) } />
                    </div>
                </div>

                <div className="type-path">
                    <div className="row">
                        <label>Value</label>
                        <input type="text" className="small" value={ value } onChange={ event => onValueChange(event.target.value) } />
                    </div>
                </div>

                <div className="row confirmation">
                    <label></label>
                    <label className="custom-checkbox align-left">
                        Encrypt
                        <input type="checkbox" checked={ encrypt } onChange={ event => onEncryptChange(event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                </div>

                <div className="row confirmation">
                    <label></label>
                    <label className="custom-checkbox align-left">
                        Ask on encrypt
                        <input type="checkbox" checked={ askOnEncrypt } onChange={ event => onAskOnEncryptChange(event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                </div>

                <div className="row confirmation">
                    <label></label>
                    <label className="custom-checkbox align-left">
                        Ask on decrypt
                        <input type="checkbox" checked={ askOnDecrypt } onChange={ event => onAskOnDecryptChange(event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                </div>

                <div className="type-path">
                    <div className="row">
                        <label>IV</label>
                        <input type="text" className="small" value={ iv } onChange={ event => onIVChange(event.target.value) } />
                    </div>
                </div>

                <div className="row">
                    <label></label>
                    <button onClick={ event => onCipherKeyValue() }>RUN</button>
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
            state: state.cipherkv,
        };
    },
    (dispatch: Dispatch) => {
        return { 
            commonActions: bindActionCreators(CommonActions, dispatch),
            methodActions: bindActionCreators(CipherKeyValueActions, dispatch),
        };
    }
)(CipherKeyValue);