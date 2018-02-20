/* @flow */
'use strict';

import React, { Component } from 'react';
import BigNumber from 'bignumber.js';
import ColorHash from 'color-hash';
import ScaleText from 'react-scale-text';
import Blockies from 'react-blockies';
import { Async } from 'react-select';
import { resolveAfter } from '../../../utils/promiseUtils';
import AbstractAccount from '../account/AbstractAccount';
import { Notification } from '../Notification';


export default class Summary extends AbstractAccount {

    componentDidMount() {
        super.componentDidMount();
        //this.props.summaryActions.init();
    }

    componentWillUpdate(newProps: any) {
        super.componentWillUpdate(newProps);
        //if (newProps.location.pathname !== this.props.location.pathname || (!newProps.summary.loaded && !this.props.summary.loaded)) {
        //if (newProps.router.pathname !== this.props.router.pathname || (!newProps.summary.loaded && !this.props.summary.loaded)) {
        //    this.props.summaryActions.init();
        //}
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        //this.props.summaryActions.dispose();
    }

    render() {
        return _render(this.props);
    }
}

const _render = (props: any): any => {
    
    const currentAccount = props.account;
    const fiatRate = props.fiatRate || '1030';

    const {
        loaded,
        address,
        summary,
        addForm,
        search,
        customAddress,
        customName,
        customShortcut,
        customDecimal,

        selectedToken
    } = props.summary;

    if (currentAccount.deviceStateError) {
        return (
            <section>
                <Notification className="error" title="Account could not be loaded" message="Incorrect passphrase" />
            </section>
        );
    }


    // if (!loaded) return null;

    const {
        onSummaryToggle,
        onTokenSearch,
        onCustomTokenToggle,
        onCustomTokenAddressChange,
        onCustomTokenNameChange,
        onCustomTokenShortcutChange,
        onCustomTokenDecimalChange,
        onCustomTokenAdd
    } = props.summaryActions;

    const tokens = props.tokens.filter(t => t.ethAddress === address);


    let summaryClassName: string = "summary closed";
    let summaryContent = null;
    if (summary) {
        summaryClassName = "summary";
        if (currentAccount && currentAccount.balance) {

            const balance = new BigNumber(currentAccount.balance);
            const fiat = balance.times(fiatRate).toFixed(2);

            summaryContent = (
                <div className="content">
                    <div className="column">
                        <div className="label">Balance</div>
                        <div className="fiat-value">${ fiat }</div>
                        <div className="value">{ currentAccount.balance } ETH</div>
                    </div>
                    <div className="column">
                        <div className="label">Rate</div>
                        <div className="fiat-value">${ fiatRate }</div>
                        <div className="value">1.00 ETH</div>
                    </div>
                </div>
            )
        } else {
            summaryContent = (
                <div className="content">
                    <div className="column">
                        <div className="label">Balance</div>
                        <div className="fiat-value">Loading...</div>
                        <div className="value">Loading...</div>
                    </div>
                    <div className="column">
                        <div className="label">Rate</div>
                        <div className="fiat-value">${ fiatRate }</div>
                        <div className="value">1.00 ETH</div>
                    </div>
                </div>
            )
        }
        
    }

    let addFormClassName = "add-token-form closed";
    let addFormContent = null;
    if (addForm) {
        addFormClassName = "add-token-form";
        addFormContent = (
            <div className="content">
                <div className="column">
                    <label>Address</label>
                    <input type="text" className="token-address" placeholder="0x0000000" value={ customAddress } onChange={ event => onCustomTokenAddressChange(event.target.value) } />
                </div>
                <div className="column">
                    <label>Name</label>
                    <input type="text" className="token-symbol" placeholder="GNO" value={ customName } onChange={ event => onCustomTokenNameChange(event.target.value) } />
                </div>
                <div className="column">
                    <label>Shortcut</label>
                    <input type="text" className="token-shortcut" placeholder="0" value={ customShortcut } onChange={ event => onCustomTokenShortcutChange(event.target.value) } />
                </div>
                <div className="column">
                    <label>Decimal</label>
                    <input type="text" className="token-decimal" placeholder="0" value={ customDecimal } onChange={ event => onCustomTokenDecimalChange(event.target.value) } />
                </div>
                <div className="column">
                    <button>Add custom token</button>
                </div>
            </div>
        )
    }

    const bg = new ColorHash({lightness: 0.7});
    //const colorHash2 = new ColorHash({lightness: 0.5});
    const colorHash2 = new ColorHash();

    console.log("SUM", tokens, address, props.tokens)
    //let tokensContent = null;
    let tokensContent = tokens.map((t, i) => {

        // if (search.length > 0) {
        //     if (t.name.toLowerCase().indexOf(search) < 0 && t.shortcut.toLowerCase().indexOf(search) < 0) return null;
        // }
        let iconColor = {
            color: colorHash2.hex(t.name),
            background: bg.hex(t.name),
            borderColor: bg.hex(t.name)
        }
        return (
            <div key={i} className="token">
                <div className="icon" style={ iconColor }>
                    <div className="icon-inner">
                        <ScaleText widthOnly><p>{ t.symbol }</p></ScaleText>
                    </div>
                </div>
                <div className="name">{ t.name }</div>
                <div className="balance">{ t.balance }</div>
            </div>
        )
    });

    let ethIcon = null;
    if (currentAccount) {
        ethIcon = (
            <Blockies
                seed={ currentAccount.address } />
        );
    }

    return (

        <section className="tokens">
            <h2>{ ethIcon } Address #{ parseInt(props.match.params.address) + 1 }</h2>

            <div className={ summaryClassName }>
                { summaryContent }
                <div className="toggle" onClick={ onSummaryToggle }></div>
            </div>

            <div className="filter">
                {/* <input type="text" placeholder="Search for token" value={ search } onChange={ event => onTokenSearch(event.target.value) } /> */}
                0x58cda554935e4a1f2acbe15f8757400af275e084
                <Async 
                    className="token-select"
                    multi={ false }
                    autoload={ false }
                    
                    ignoreCase={ true }
                    filterOptions= { 
                        (opt, str, values) => {
                            console.log("FILTERRR", opt, str, values);
                            return opt;
                        }
                    }


                    value={ selectedToken } 
                    onChange={ props.summaryActions.selectToken } 
                    valueKey="symbol" 
                    labelKey="symbol" 
                    placeholder="Search for token"
                    loadOptions={ props.summaryActions.loadTokens } 
                    backspaceRemoves={true} />

            </div>

            <div className={ addFormClassName }>
                <div className="toggle" onClick={ onCustomTokenToggle }>
                    Add token
                </div>
                { addFormContent }
            </div>

            <div>
                { tokensContent }
            </div>
        </section>

    );
}

const onChange = () => {
}

const gotoUser = () => {
}