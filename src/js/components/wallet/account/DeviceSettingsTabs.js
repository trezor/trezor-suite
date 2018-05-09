/* @flow */
'use strict';

import React, { Component } from 'react';
import { NavLink } from 'react-router-dom';


type Props = {
    pathname: string;
}
type State = {
    style: {
        width: number,
        left: number
    };
}

const AccountTabs = (props: any): any => {

    const urlParams = props.match.params;
    //const urlParams = props.match ? props.match.params : { address: '0' };
    const basePath = `/device/${urlParams.device}/network/${urlParams.network}/address/${urlParams.address}`;

    return (
        <div className="account-tabs">
            <a>Device settings</a>
        </div>
    );
}

export default AccountTabs;