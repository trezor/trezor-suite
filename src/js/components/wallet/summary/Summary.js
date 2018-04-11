/* @flow */
'use strict';

import React, { Component } from 'react';
import BigNumber from 'bignumber.js';
import { Async } from 'react-select';
import { resolveAfter } from '../../../utils/promiseUtils';
import AbstractAccount from '../account/AbstractAccount';
import { Notification } from '../../common/Notification';
import SummaryDetails from './SummaryDetails.js';
import SummaryTokens from './SummaryTokens.js';
import { findDevice } from '../../../utils/reducerUtils';


export default class Summary extends AbstractAccount {
    render() {
        console.warn("RENDER SUMMARY!", this.device, this.discovery, this)
        return super.render(this.props.summary) || _render(this.props, this.device, this.discovery, this.account, this.deviceStatusNotification);
    }
}

const _render = (props: any, device, discovery, account, deviceStatusNotification): any => {

    //const device = props.devices.find(d => d.state === props.summary.deviceState && d.features.device_id === props.summary.deviceId);
    // const device = findDevice(props.devices, props.summary.deviceState, props.summary.deviceId);
    // const discovery = props.discovery.find(d => d.deviceState === device.state && d.network === props.summary.network);
    //const account = props.accounts.find(a => a.deviceState === props.summary.deviceState && a.index === props.summary.accountIndex && a.network === props.summary.network);
    const tokens = props.tokens.filter(t => t.ethAddress === account.address);

    return (

        <section className="summary">
            { deviceStatusNotification }

            <h2 className={ `summary-header ${props.summary.network}` }>Address #{ parseInt(props.match.params.address) + 1 }</h2>

            <SummaryDetails 
                summary={ props.summary } 
                balance={ account.balance }
                network={ props.summary.network }
                fiat={ props.fiat }
                localStorage={ props.localStorage }
                onToggle={ props.summaryActions.onDetailsToggle } />

            <h2>Tokens</h2>
            {/* 0x58cda554935e4a1f2acbe15f8757400af275e084 */}
            <div className="filter">
                <Async 
                    className="token-select"
                    multi={ false }
                    autoload={ false }
                    ignoreCase={ true }
                    filterOptions= { 
                        (options, search, values) => {
                            return options.filter(o => {
                                return !tokens.find(t => t.symbol === o.symbol);
                            });
                        }
                    }

                    value={ props.summary.selectedToken } 
                    onChange={ token => props.summaryActions.selectToken(token, account) } 
                    valueKey="symbol" 
                    labelKey="symbol" 
                    placeholder="Search for token"
                    searchPromptText="Type token name or address"
                    noResultsText="Token not found"
                    loadOptions={ input => props.summaryActions.loadTokens(input, account) } 
                    backspaceRemoves={true} />

            </div>

            <SummaryTokens tokens={ tokens } removeToken={ props.summaryActions.removeToken } />

        </section>

    );
}