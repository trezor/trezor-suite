/* @flow */
'use strict';

import React, { Component } from 'react';
import { QRCode } from 'react-qr-svg';
import AbstractAccount from './account/AbstractAccount';
import { Notification } from '../common/Notification';
import Tooltip from 'rc-tooltip';

export default class Receive extends AbstractAccount {
    render() {
        return super.render(this.props.receive) || _render(this.props);
    }
}

const _render = (props: any): any => {

    const {
        checksum,
        accountIndex,
        coin,
        addressVerified,
        addressUnverified,
    } = props.receive;

    const device = props.devices.find(d => d.checksum === checksum);
    const account = props.accounts.find(a => a.checksum === checksum && a.index === accountIndex && a.coin === coin);

    let qrCode = null;
    let address = `${account.address.substring(0, 20)}...`;
    let className = 'address hidden';
    let button = (
        <button onClick={ event => props.showAddress(account.addressPath) }>
            <span>Show full address</span>
        </button>
    );

    if (addressVerified || addressUnverified) {
        qrCode = (
            <QRCode
                className="qr"
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="Q"
                style={{ width: 256 }}
                value={ account.address }
                />
        );
        address = account.address;
        className = addressUnverified ? 'address unverified' : 'address';

        const tooltip = addressUnverified ?
            (<div>Unverified address.<br/>{ device.connected ? 'Show on TREZOR' : 'Connect your TREZOR to verify it.' }</div>)
            :
            (<div>{ device.connected ? 'Show on TREZOR' : 'Connect your TREZOR to verify address.' }</div>);

        button = (
            <Tooltip
                arrowContent={<div className="rc-tooltip-arrow-inner"></div>}
                overlay={ tooltip }
                placement="bottomRight">
                <button className="white" onClick={ event => props.showAddress(account.addressPath) }>
                    <span></span>
                </button>
            </Tooltip>
        );
    }
    
    return (
        <section className="receive">
            { !device.connected ? (
                <Notification className="info" title={ `Device ${ device.instanceLabel } is disconnected` } />
            ) : null }
            <h2>Receive Ethereum or tokens</h2>
            
            <div className={ className }>
                <div className="value">
                    { address }
                </div>
                { button }
            </div>
            { qrCode }
        </section>
    );


}

