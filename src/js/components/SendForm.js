/* @flow */
'use strict';

import React, { Component } from 'react';
import AddressTab from './AddressTab';

const SendForm = (props): any => {

    console.log("ENDFORM", props)

    const addressId = parseInt( props.match.params.address );

    const { 
        address,
        amount,
        gasPrice,
        gasLimit,
        data
     } = props.sendForm;

     const {
        onAddressChange,
        onAmountChange,
        onGasPriceChange,
        onGasLimitChange,
        onDataChange,
        onSend
     } = props.sendFormActions;

    const disabled = false;

    return (
        <section className="send-form">

            <AddressTab match={ props.match } />

            <div className="row">
                <label>Amount</label>
                <input type="text" value={ address } onChange={ event => onAddressChange(event.target.value) } />
            </div>

            <div className="row">
                <label>Address</label>
                <input type="text" value={ amount } onChange={ event => onAmountChange(event.target.value) } />
            </div>

            <div className="row">
                <label>Gas limit</label>
                <input type="text" value={ gasLimit } onChange={ event => onGasLimitChange(event.target.value) } />
            </div>

            <div className="row">
                <label>Gas price</label>
                <input type="text" value={ gasPrice } onChange={ event => onGasPriceChange(event.target.value) } />
                GWEI
            </div>

            <div className="row">
                <label>Data</label>
                <input type="text" value={ data } onChange={ event => onDataChange(event.target.value) } />
            </div>

            <div className="row">
                <label></label>
                <button disabled={ disabled } onClick={ event => onSend(addressId) }>SEND</button>
            </div>
    
        </section>
    );
}

export default SendForm;
