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
                    { navLink('/', 'Get public key') }
                    { navLink('/nem-signtx', 'NEM Sign Transaction') }



                    {/* { navLink('/compose', 'Compose treansaction') }
                    { navLink('/custom', 'Custom call') }
                    { navLink('/accountinfo', 'Get account info') }
                    { navLink('/showaddress', 'Show address on TREZOR') }
                    { navLink('/requestlogin', 'Request login') }
                    { navLink('/signmsg', 'Sign &amp; Verify message') }
                    { navLink('/signmsg_eth', 'Sign &amp; Verify Ethereum message') }
                    { navLink('/cipherkv', 'Symmetrically encrypt / decrypt value') }
                    { navLink('/signtx', 'Sign P2PKH transaction') }
                    { navLink('/signtx_opreturn', 'Sign OP_RETURN transaction') }
                    { navLink('/signtx_multisig', 'Sign multisig transaction') }
                    { navLink('/signtx_eth', 'Sign Ethereum transaction') }
                    { navLink('/signtx_nem', 'Sign NEM transaction') } */}
                </section>
                { this.props.children }
            </main>
        );
    }
}
