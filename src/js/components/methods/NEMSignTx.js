/* @flow */
'use strict';

import React from 'react';
import CoinSelect from './CoinSelect';
import AccountSelect from './AccountSelect';
import Response from './Response';

const NEMSignTx = (props): any => {

    const {
        onSignTx
    } = props.nemSignTxActions;

    const {
        response,
        responseTab,
        code,
        params
    } = props.nemSignTx;

    return (
        <section className="method-content">

            <div className="method-params">
                <div className="row">
                    <button onClick={ event => onSignTx('SupplyChange') }>Mosaic SupplyChange</button>
                </div>
                <div className="row">
                    <button onClick={ event => onSignTx('MosaicCreation') }>Mosaic Creation</button>
                </div>
                <div className="row">
                    <button onClick={ event => onSignTx('MosaicCreationProperties') }>Mosaic Creation with properies</button>
                </div>
                <div className="row">
                    <button onClick={ event => onSignTx('MosaicCreationLevy') }>Mosaic Creation Levy</button>
                </div>

                <div className="row">
                    <button onClick={ event => onSignTx('AggregateModifications') }>Aggregate Modifications</button>
                </div>

                <div className="row">
                    <button onClick={ event => onSignTx('Multisig1') }>Multisig1</button>
                    <button onClick={ event => onSignTx('Multisig2') }>Multisig2</button>
                </div>

                <div className="row">
                    <button onClick={ event => onSignTx('MultisigSigner1') }>Multisig Signer 1</button>
                    <button onClick={ event => onSignTx('MultisigSigner2') }>Multisig Signer 2</button>
                </div>

                <div className="row">
                    <button onClick={ event => onSignTx('ImportanceTransfer') }>Importance Transfer</button>
                </div>

                <div className="row">
                    <button onClick={ event => onSignTx('ProvisionNamespace') }>Provision Namespace</button>
                </div>

                <div className="row">
                    <button onClick={ event => onSignTx('Simple') }>Simple</button>
                </div>
                <div className="row">
                    <button onClick={ event => onSignTx('EncryptedPayload') }>Encrypted Payload</button>
                </div>
                <div className="row">
                    <button onClick={ event => onSignTx('XemAsMosaic') }>Xem As Mosaic</button>
                </div>

                <div className="row">
                    <button onClick={ event => onSignTx('UnknownMosaic') }>Unknown Mosaic</button>
                </div>

                <div className="row">
                    <button onClick={ event => onSignTx('KnownMosaic') }>Known Mosaic</button>
                </div>

                <div className="row">
                    <button onClick={ event => onSignTx('KnownMosaicWithLevy') }>Known Mosaic With Levy</button>
                </div>

                <div className="row">
                    <button onClick={ event => onSignTx('MultipleMosaics') }>Multiple mosaics</button>
                </div>
            </div>

            <Response 
                response={ response }
                code={ code }
                responseTab={ responseTab }
                onResponseTabChange={ props.nemSignTxActions.onResponseTabChange } />

        </section>
    );
}

export default NEMSignTx;