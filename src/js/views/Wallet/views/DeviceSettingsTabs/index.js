/* @flow */


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
    const basePath = `/device/${urlParams.device}/network/${urlParams.network}/account/${urlParams.account}`;

    return (
        <div className="account-tabs">
            <a>Device settings</a>
        </div>
    );
};

export default AccountTabs;