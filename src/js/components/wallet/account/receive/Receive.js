/* @flow */
'use strict';

import React, { Component } from 'react';

import Tooltip from 'rc-tooltip';
import { QRCode } from 'react-qr-svg';

import AbstractAccount from '../AbstractAccount';
import { Notification } from '~/js/components/common/Notification';

import type { AccountState } from '../AbstractAccount';
import type { Props } from './index';

export default class Receive extends AbstractAccount<Props> {
    render() {
        return super.render() || _render(this.props, this.state);
    }
}

const _render = (props: Props, state: AccountState): React$Element<string> => {

    const {
        device,
        account,
        discovery,
        deviceStatusNotification
    } = state;

    const {
        addressVerified,
        addressUnverified,
    } = props.receive;

    if (!device || !account || !discovery) return <section></section>;

    let qrCode = null;
    let address = `${account.address.substring(0, 20)}...`;
    let className = 'address hidden';
    let button = (
        <button disabled={ device.connected && !discovery.completed }>
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
            (<div>Unverified address.<br/>{ device.connected && device.available ? 'Show on TREZOR' : 'Connect your TREZOR to verify it.' }</div>)
            :
            (<div>{ device.connected ? 'Show on TREZOR' : 'Connect your TREZOR to verify address.' }</div>);

        button = (
            <Tooltip
                arrowContent={<div className="rc-tooltip-arrow-inner"></div>}
                overlay={ tooltip }
                placement="bottomRight">
                <button className="white">
                    <span></span>
                </button>
            </Tooltip>
        );
    }
    
    return (
        <section className="receive">
            { deviceStatusNotification }
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