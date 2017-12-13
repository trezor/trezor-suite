/* @flow */
'use strict';

import React, { Component } from 'react';
import AddressTab from './AddressTab';

const formatTime = (ts) => {
    var date = new Date(ts * 1000);
    // Hours part from the timestamp
    var hours = date.getHours();
    // Minutes part from the timestamp
    var minutes = "0" + date.getMinutes();
    // Seconds part from the timestamp
    var seconds = "0" + date.getSeconds();
    
    // Will display time in 10:30:23 format
    return hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
}

const History = (props): any => {

    const web3 = props.web3;
    const { addresses } = props.addresses;
    const currentAddress = addresses[ parseInt(props.match.params.address) ];

    if (!currentAddress) return null;

    let txs = null;
    let pendingTransactions = null;

    if (currentAddress.history) {

        const pending = currentAddress.pendingTx;
        
        if (pending.length > 0) {
            pendingTransactions = pending.map((tx, i) => {

                const etherscanLink = `https://ropsten.etherscan.io/tx/${ tx.txid }`;

                return (
                    <div key={i} className="history-pending-transaction">
                        <a href={ etherscanLink } target="_blank">Details</a>
                        <span className="address">{ tx.txid }</span>
                        Pending...
                    </div>
                )
            });
        }

        const history = JSON.parse(currentAddress.history).result;
        txs = history.map((tx, i) => {

            const etherscanLink = `https://ropsten.etherscan.io/tx/${ tx.hash }`;
            const txType = tx.from === currentAddress.address ? 'out' : 'in';
            const txAddress = txType === 'out' ? tx.to : tx.from;
            return (

                
                <div key={i} className={ `history-transaction ${ txType}` }>
                    <a href={etherscanLink} target="_blank">Details</a>
                    <span className="time">{ formatTime( parseInt(tx.timeStamp) ) }</span>
                    <span className="address">{ txAddress }</span>
                    <span className="amount">{ web3.fromWei(tx.value, 'ether') }</span>
                </div>
                // <Link key={i} to={ `/address/${address.address}` }>
                //     { `Account #${(address.index + 1 )}` }
                //     <span>{ address.balance } ETH</span>
                //     <span>{ address.address }</span>
                // </Link>
            )
        })
    }

    return (
        <section className="history">
            <AddressTab match={ props.match } />

            { pendingTransactions ?
                    <div>
                        <h2>Pending:</h2>
                        { pendingTransactions }
                    </div>
            : null}

            <h3>HISTORY OF { currentAddress.address }</h3>
            { txs }
        </section>
    );
}

export default History;
