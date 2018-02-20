/* @flow */
'use strict';

import React from 'react';
import { NavLink } from 'react-router-dom';

const AccountTabs = (props: any): any => {

    const urlParams = props.match.params;
    //const urlParams = props.match ? props.match.params : { address: '0' };
    const basePath = `/device/${urlParams.device}/coin/${urlParams.coin}/address/${urlParams.address}`;

    return (
        <div className="account-tabs">
            {/* <NavLink to={ `${basePath}` }>
                History
            </NavLink> */}
            <NavLink exact to={ `${basePath}` }>
                Summary
            </NavLink>
            <NavLink to={ `${basePath}/send` }>
                Send
            </NavLink>
            <NavLink to={ `${basePath}/receive` }>
                Receive
            </NavLink>
            <NavLink to={ `${basePath}/signverify` }>
                Sign &amp; Verify
            </NavLink>
        </div>
    );
}

export default AccountTabs;