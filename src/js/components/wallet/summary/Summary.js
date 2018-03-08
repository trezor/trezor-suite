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


export default class Summary extends AbstractAccount {
    render() {
        return super.render(this.props.summary) || _render(this.props);
    }
}

const _render = (props: any): any => {

    const device = props.devices.find(d => d.checksum === props.summary.checksum);
    const discovery = props.discovery.find(d => d.checksum === device.checksum && d.coin === props.summary.coin);
    const account = props.accounts.find(a => a.checksum === props.summary.checksum && a.index === props.summary.accountIndex && a.coin === props.summary.coin);
    const tokens = props.tokens.filter(t => t.ethAddress === account.address);

    return (

        <section className="summary">
            { !device.connected ? (
                <Notification className="info" title={ `Device ${ device.instanceLabel } is disconnected` } />
            ) : null }

            <h2 className={ `summary-header ${props.summary.coin}` }>Address #{ parseInt(props.match.params.address) + 1 }</h2>

            <SummaryDetails 
                summary={ props.summary } 
                balance={ account.balance }
                coin={ props.summary.coin }
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