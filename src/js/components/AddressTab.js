/* @flow */
'use strict';

import React from 'react';
import { Link } from 'react-router-dom';

const AddressTab = (props): any => {

    const urlParams = props.match.params;
    const basePath = `/address/${urlParams.address}`;

    return (
        <div className="address-menu">
            <Link to={ `${basePath}` }>
                History
            </Link>
            <Link to={ `${basePath}/send` }>
                Send
            </Link>
            <Link to={ `${basePath}/receive` }>
                Receive
            </Link>
        </div>
    );
}

export default AddressTab;