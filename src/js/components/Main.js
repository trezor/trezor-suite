/* @flow */
'use strict';

import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';

const navLink = (url: string, label: string) => {

    return (
        <NavLink
            to={ url }
            exact
            activeClassName="selected">
            { label }
        </NavLink>
    );
}

export default class Main extends Component {
    render() {
        return (
            <main>
                <section className="methods">
                    { navLink('/cipherkv', 'Symmetrically encrypt / decrypt value') }
                    { navLink('/login', 'Login') }
                    { navLink('/', 'Get public key') }
                    { navLink('/getaddress', 'Get address') }
                    { navLink('/signmessage', 'Sign message') }
                    { navLink('/verifymessage', 'Verify message') }
                    { navLink('/get-accountinfo', 'Get account info') }
                    { navLink('/sign-tx', 'Sign transaction') }
                    { navLink('/composetx', 'Payment request') }
                    { navLink('/push-tx', 'Push Transaction') }
                    { navLink('/eth-getaddress', 'Ethereum Get Address') }
                    { navLink('/eth-signtx', 'Ethereum Sign Transaction') }
                    { navLink('/eth-signmessage', 'Ethereum Sign Message') }
                    { navLink('/eth-verifymessage', 'Ethereum Verify Message') }
                    { navLink('/nem-getaddress', 'NEM Get Address') }
                    { navLink('/nem-signtx', 'NEM Sign Transaction') }
                    { navLink('/stellar-getaddress', 'Stellar Get Address') }
                    { navLink('/stellar-signtx', 'Stellar Sign Transaction') }
                    { navLink('/cardano-getaddress', 'Cardano Get Address') }
                    { navLink('/cardano-signtx', 'Cardano Sign Transaction') }
                    { navLink('/cardano-signmessage', 'Cardano Sign Message') }
                    { navLink('/cardano-verifymessage', 'Cardano Verify Message') }
                    { navLink('/custom', 'Custom Message') }
                </section>
                { this.props.children }
            </main>
        );
    }
}
