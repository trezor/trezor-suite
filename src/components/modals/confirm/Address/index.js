/* @flow */
import React, { Component } from 'react';

import { findAccount } from 'reducers/AccountsReducer';

const Wrapper = styled.div`
    width: 370px;
    padding: 24px 48px;
`;

const Header = styled.div`
`;

const Content = styled.div`
    border-top: 1px solid ${colors.DIVIDER};
    background: ${colors.MAIN};
    padding: 24px 48px;
`;

const Label = styled.div`
    font-size: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

const ConfirmAddress = (props: Props) => {
    const {
        account,
        network,
    } = props.selectedAccount;
    if (!account || !network) return null;

    return (
        <div className="confirm-address">
            <div className="header">
                <h3>Confirm address on TREZOR</h3>
                <p>Please compare your address on device with address shown bellow.</p>
            </div>
            <div className="content">
                <p>{ account.address }</p>
                <label>{ network.symbol } account #{ (account.index + 1) }</label>
            </div>
        </div>
    );
};

export default ConfirmAddress;