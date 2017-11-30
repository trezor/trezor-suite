/* @flow */
'use strict';

import React from 'react';
import CoinSelect from './CoinSelect';
import AccountSelect from './AccountSelect';
import Response from './Response';

const GetPublicKey = (props): any => {

    const { 
        onCoinChange,
        onTypeChange,
        onPathChange,
        onAccountChange,
        onAccountTypeChange,
        onConfirmationChange,
        onGetXpub,
        onResponseTabChange
    } = props.getXpubActions;

    const {
        coin,
        type,
        path,
        accountID,
        accountLegacy,
        confirmation,
        response,
        responseTab,
        code,
        params
    } = props.getXpub;

    return (
        <section className="method-content">

            <div className="method-params">
                <CoinSelect coin={ coin } onCoinChange={ onCoinChange } />
            
                <div className="row">
                    <label>Use</label>
                    <label className="custom-checkbox align-left radio">
                        path
                        <input 
                            type="radio"
                            name="method-type"
                            value="path"
                            checked={ type === 'path' }
                            onChange={ event => onTypeChange(event.target.value) } />
                        <span className="indicator"></span>
                    </label>
                    <label className="custom-checkbox align-left radio">
                        account id
                        <input 
                            type="radio"
                            name="method-type"
                            value="account"
                            checked={ type === 'account' }
                            onChange={ event => onTypeChange(event.target.value) } />
                        <span className="indicator"></span>
                    </label>
                    <label className="custom-checkbox align-left radio">
                        discovery
                        <input 
                            type="radio"
                            name="method-type"
                            value="discovery"
                            checked={ type === 'discovery' }
                            onChange={ event => onTypeChange(event.target.value) } />
                        <span className="indicator"></span>
                    </label>
                </div>

                <div className="type-path" style={{display: type === 'path' ? 'block' : 'none' }}>
                    <div className="row">
                        <label>Path</label>
                        <input type="text" className="small" value={ path } onChange={ event => onPathChange(event.target.value) } />
                    </div>
                </div>

                <div className="type-account" style={{display: type === 'account' ? 'block' : 'none' }}>
                    <AccountSelect
                        accountID={ accountID }
                        accountLegacy={ accountLegacy }
                        onAccountChange={ onAccountChange }
                        onAccountTypeChange={ onAccountTypeChange }
                        />
                </div>

                <div className="row confirmation" style={{display: type !== 'discovery' ? 'block' : 'none' }}>
                    <label></label>
                    <label className="custom-checkbox align-left">
                        Confirmation
                        <input type="checkbox" checked={ confirmation } onChange={ event => onConfirmationChange(event.target.checked) } />
                        <span className="indicator"></span>
                    </label>
                </div>

                <div className="row">
                    <label></label>
                    <button onClick={ event => onGetXpub(params) }>Get public key</button>
                </div>

            </div>

            <Response 
                response={ response }
                code={ code }
                responseTab={ responseTab }
                onResponseTabChange={ onResponseTabChange } />

        </section>
    );
}

export default GetPublicKey;