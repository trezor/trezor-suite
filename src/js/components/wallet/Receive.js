/* @flow */
'use strict';

import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import Tooltip from 'rc-tooltip';
import { QRCode } from 'react-qr-svg';

import AbstractAccount from './account/AbstractAccount';
import { Notification } from '../common/Notification';
import * as ReceiveActions from '../../actions/ReceiveActions';

class Receive extends AbstractAccount {
    render() {
        return super.render(this.props.receive) || _render(this.props, this.device, this.account, this.deviceStatusNotification);
    }
}

const _render = (props: any, device, account, deviceStatusNotification): any => {

    const {
        network,
        deviceState,
        accountIndex,
        addressVerified,
        addressUnverified,
    } = props.receive;

    // const device = props.devices.find(d => d.state === deviceState);
    // const account = props.accounts.find(a => a.deviceState === deviceState && a.index === accountIndex && a.network === network);

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
            (<div>Unverified address.<br/>{ device.connected && device.available ? 'Show on TREZOR' : 'Connect your TREZOR to verify it.' }</div>)
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

const mapStateToProps = (state, own) => {
    return {
        location: state.router.location,
        devices: state.connect.devices,
        accounts: state.accounts,
        discovery: state.discovery,
        receive: state.receive
    };
}

const mapDispatchToProps = (dispatch) => {
    return { 
        initAccount: bindActionCreators(ReceiveActions.init, dispatch), 
        updateAccount: bindActionCreators(ReceiveActions.update, dispatch),
        disposeAccount: bindActionCreators(ReceiveActions.dispose, dispatch),
        showAddress: bindActionCreators(ReceiveActions.showAddress, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(Receive);