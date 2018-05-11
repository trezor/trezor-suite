/* @flow */
'use strict';

import React, { PureComponent } from 'react';
import { Link, NavLink } from 'react-router-dom';
import BigNumber from 'bignumber.js';

import { findDeviceAccounts } from '../../../reducers/AccountsReducer';
import { findSelectedDevice } from '../../../reducers/TrezorConnectReducer';
import Loader from '../../common/LoaderCircle';
import Tooltip from 'rc-tooltip';

import type { Props } from './index';
import type { TrezorDevice } from '../../../flowtype';

const AccountSelection = (props: Props): ?React$Element<string> => {

    const selected = findSelectedDevice(props.connect);
    if (!selected) return null;

    const { location } = props.router;
    const urlParams = location.state;
    const accounts = props.accounts;
    const baseUrl: string = urlParams.deviceInstance ? `/device/${urlParams.device}:${urlParams.deviceInstance}` : `/device/${urlParams.device}`;

    const { config } = props.localStorage;
    const selectedCoin = config.coins.find(c => c.network === location.state.network);
    if (!selectedCoin) return;

    const fiatRate = props.fiat.find(f => f.network === selectedCoin.network);

    const deviceAddresses: Array<any> = findDeviceAccounts(accounts, selected, location.state.network);
    let selectedAccounts = deviceAddresses.map((address, i) => {
        // const url: string = `${baseUrl}/network/${location.state.network}/address/${i}`;
        const url: string = location.pathname.replace(/address+\/([0-9]*)/, `address/${i}`);
        
        let balance: string = 'Loading...';
        if (address.balance !== '') {
            if (fiatRate) {
                const accountBalance = new BigNumber(address.balance);
                const fiat = accountBalance.times(fiatRate.value).toFixed(2);
                balance = `${ address.balance } ${ selectedCoin.symbol } / $${ fiat }`;
            } else {
                balance = `${ address.balance } ${ selectedCoin.symbol }`;
            }
        }

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
    const discovery = props.discovery.find(d => d.deviceState === selected.state && d.network === location.state.network);
   
    if (discovery) {
        if (discovery.completed) {
            // TODO: add only if last one is not empty
            //if (selectedAccounts.length > 0 && selectedAccounts[selectedAccounts.length - 1])
            const lastAccount = deviceAddresses[deviceAddresses.length - 1];
            if (lastAccount && (new BigNumber(lastAccount.balance).greaterThan(0) || lastAccount.nonce > 0)) {
                discoveryStatus = (
                    <div className="add-address" onClick={ props.addAddress }>
                        Add address
                    </div>
                );
            } else {
                const tooltip = (
                    <div className="aside-tooltip-wrapper">
                        To add a new address, last address must have some transactions.
                    </div>
                )
                discoveryStatus = (
                    <Tooltip
                            arrowContent={<div className="rc-tooltip-arrow-inner"></div>}
                            overlay={ tooltip }
                            placement="top">
                            <div className="add-address disabled">
                                Add address
                            </div>
                    </Tooltip>
                );
            }
            
        } else if (!selected.connected) {
            discoveryStatus = (
                <div className="discovery-status">
                    Addresses could not be loaded
                    <span>{ `Connect ${ selected.instanceLabel } device` }</span>
                </div>
            );
        } else {
            discoveryStatus = (
                <div className="discovery-loading">
                    <Loader size="20" /> Loading accounts...
                </div>
            );
        }
    }

    
    let backButton = null;
    if (selectedCoin) {
        backButton = (
            <NavLink to={ baseUrl } className={ `back ${ selectedCoin.network }` }>
                <span className={ selectedCoin.network }>{ selectedCoin.name }</span>
            </NavLink>
        );
    }

    return (
        <section>
            { backButton }
            <div>
                { selectedAccounts }
            </div>
            { discoveryStatus }
        </section>
    );
}

export default AccountSelection;