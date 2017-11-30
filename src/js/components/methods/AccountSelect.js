/* @flow */
'use strict';

import React from 'react';

const AccountSelect = (props): any => {
    return (
        <div className="row" >
            <label>Account</label>
            <select value={ props.accountID } onChange={ event => props.onAccountChange(event.target.value) }>
                <option value="0">Account #1</option>
                <option value="1">Account #2</option>
                <option value="2">Account #3</option>
                <option value="3">Account #4</option>
                <option value="4">Account #5</option>
                <option value="5">Account #6</option>
                <option value="6">Account #7</option>
                <option value="7">Account #8</option>
                <option value="8">Account #9</option>
                <option value="9">Account #10</option>
            </select>
            <label className="custom-checkbox align-left">
                Legacy account
                <input type="checkbox" value={ props.accountLegacy } onChange={ event => props.onAccountTypeChange(event.target.checked) } />
                <span className="indicator"></span>
            </label>
        </div>

        
    );
}

export default AccountSelect;