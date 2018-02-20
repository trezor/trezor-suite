/* @flow */
'use strict';

import React, { PureComponent } from 'react';
import { Link, NavLink } from 'react-router-dom';
import BigNumber from 'bignumber.js';

import { getAccounts } from '../../../utils/reducerUtils';
import { findSelectedDevice } from '../../../reducers/TrezorConnectReducer';
import Loader from '../../common/LoaderCircle';

const AccountSelection = (props: any): any => {

    const selected = findSelectedDevice(props.connect);
    if (!selected) return null;

    const { location } = props.router;
    const accounts = props.accounts;
    const baseUrl: string = `/device/${location.params.device}`;
    const fiatRate = props.fiatRate || '1';

    // console.warn("AccountSelectionRender", selected, props);

    const deviceAddresses: Array<any> = getAccounts(accounts, selected, location.params.coin);
    let selectedAccounts = deviceAddresses.map((address, i) => {
        // const url: string = `${baseUrl}/coin/${location.params.coin}/address/${i}`;
        const url: string = location.pathname.replace(/address+\/([0-9]*)/, `address/${i}`);
        const b = new BigNumber(address.balance);
        const fiat = b.times(fiatRate).toFixed(2);
        const balance = address.balance !== '' ? `${ address.balance } ${ location.params.coin.toUpperCase() } / $${ fiat }` : 'Loading...';
        return (
            <NavLink key={i} activeClassName="selected" className="account" to={ url }>
                { `Address #${(address.index + 1 )}` }
                <span>{ address.loaded ? balance : "Loading..." }</span>
            </NavLink>
        )
    });

    if (selectedAccounts.length < 1) {
        if (selected.connected) {
            const url: string = location.pathname.replace(/address+\/([0-9]*)/, `address/0`);
            selectedAccounts = (
                <NavLink activeClassName="selected" className="account" to={ url }>
                    Address #1
                    <span>Loading...</span>
                </NavLink>
            )
        }
    }

    let discoveryStatus = null;
    const discovery = props.discovery.find(d => d.checksum === selected.checksum && d.coin === location.params.coin);
   
    if (discovery) {
        if (discovery.completed) {
            // TODO: add only if last one is not empty
            discoveryStatus = (
                <div className="add-address" onClick={ props.addAddress } >
                    Add address
                </div>
            )
        } else if (!selected.connected) {
            discoveryStatus = (
                <div className="discovery-status">
                    Addresses could not be loaded
                    <span>{ `Connect ${ selected.instanceLabel } device` }</span>
                </div>
            )
        } else {
            discoveryStatus = (
                <div className="discovery-loading">
                    <Loader size="20" /> Loading accounts...
                </div>
            )
        }
    }

    const { config } = props.localStorage;
    const selectedCoin = config.coins.find(c => c.shortcut === location.params.coin);
    let backButton = null;
    if (selectedCoin) {
        backButton = (
            <NavLink to={ baseUrl } className={ `back ${ selectedCoin.shortcut }` }>
                <span className={ selectedCoin.shortcut }>{ selectedCoin.name }</span>
            </NavLink>
        );
    }

    return (
        <section>
            { backButton }
            { selectedAccounts }
            { discoveryStatus }
        </section>
    );
}

export default AccountSelection;