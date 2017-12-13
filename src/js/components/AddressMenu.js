/* @flow */
'use strict';

import React from 'react';
import { NavLink } from 'react-router-dom';

const AddressMenu = (props): any => {

    const { addresses } = props.addresses;

    let accounts = addresses.map((address, i) => {
        return (
            <NavLink key={i} activeClassName="selected" to={ `/address/${i}` }>
                { `Address #${(address.index + 1 )}` }
                <span>{ address.balance } ETH</span>
            </NavLink>
        )
    })

    return (
        <section className="accounts">
            { accounts }
        </section>
    );
}

export default AddressMenu;