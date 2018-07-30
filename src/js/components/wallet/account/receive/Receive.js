/* @flow */
import React, { Component } from 'react';
import styled from 'styled-components';
import { H2 } from '~/js/components/common/Heading';

import Tooltip from 'rc-tooltip';
import { QRCode } from 'react-qr-svg';

import SelectedAccount from '../SelectedAccount';
import { Notification } from '~/js/components/common/Notification';

import type { Props } from './index';

const Wrapper = styled.div``;

const Receive = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const {
        account,
        network,
        discovery,
    } = props.selectedAccount;

    if (!device || !account || !discovery) return null;

    const {
        addressVerified,
        addressUnverified,
    } = props.receive;

    let qrCode = null;
    let address = `${account.address.substring(0, 20)}...`;
    let className = 'address hidden';
    let button = (
        <button disabled={device.connected && !discovery.completed} onClick={event => props.showAddress(account.addressPath)}>
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
                value={account.address}
            />
        );
        address = account.address;
        className = addressUnverified ? 'address unverified' : 'address';

        const tooltip = addressUnverified
            ? (<div>Unverified address.<br />{ device.connected && device.available ? 'Show on TREZOR' : 'Connect your TREZOR to verify it.' }</div>)
            : (<div>{ device.connected ? 'Show on TREZOR' : 'Connect your TREZOR to verify address.' }</div>);

        button = (
            <Tooltip
                arrowContent={<div className="rc-tooltip-arrow-inner" />}
                overlay={tooltip}
                placement="bottomRight"
            >
                <button className="white" onClick={event => props.showAddress(account.addressPath)}>
                    <span />
                </button>
            </Tooltip>
        );
    }

    let ver = null;
    if (props.modal.opened && props.modal.windowType === 'ButtonRequest_Address') {
        className = 'address verifying';
        address = account.address;
        ver = (<div className="confirm">Confirm address on TREZOR</div>);
        button = (<div className="confirm">{ account.network } account #{ (account.index + 1) }</div>);
    }

    return (
        <Wrapper>
            <H2>Receive Ethereum or tokens</H2>
            <div className={className}>
                { ver }
                <div className="value">
                    { address }
                </div>
                { button }
            </div>
            { qrCode }
        </Wrapper>
    );
};

export default (props: Props) => (
    <SelectedAccount {...props}>
        <Receive {...props} />
    </SelectedAccount>
);