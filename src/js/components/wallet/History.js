/* @flow */
'use strict';

import React, { Component } from 'react';

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

                const etherscanLink = `https://ropsten.etherscan.io/tx/${ tx.hash }`;

                return (
                    <div key={i} className="history-pending-transaction">
                        <a href={ etherscanLink } target="_blank">Details</a>
                        <span className="address">{ tx.to }</span>
                        Pending...
                    </div>
                )
            });
        }

        txs = currentAddress.history.map((tx, i) => {
            const etherscanLink = `https://ropsten.etherscan.io/tx/${ tx.hash }`;
            return (
                <div key={i} className={ `history-transaction ${ tx.type }` }>
                    <a href={ etherscanLink } target="_blank">Details</a>
                    <span className="time">{ formatTime( parseInt(tx.timeStamp) ) }</span>
                    <span className="address">{ tx.address }</span>
                    <span className="amount">{ web3.fromWei(tx.value, 'ether') }</span>
                </div>
            )
        })
    }

    return (
        <section className="history">
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
