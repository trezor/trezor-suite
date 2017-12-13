/* @flow */
'use strict';

import React, { Component } from 'react';
import AddressTab from './AddressTab';
import { QRCode } from 'react-qr-svg';

const History = (props): any => {

    const { addresses } = props.addresses;
    const currentAddress = addresses[ parseInt(props.match.params.address) ];

    if (!currentAddress) return null;

    return (
        <section className="receive">
            <AddressTab match={ props.match } />
            <h3>{ currentAddress.address }</h3>
            <QRCode
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                    level="Q"
                    style={{ width: 256 }}
                    value={ currentAddress.address }
                />
        </section>
    );
}

export default History;
