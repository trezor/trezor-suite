import React from 'react';
import { Button } from '@trezor/components';
import { formatAmount } from '../../utils/formatUtils';

const AccountSelection = props => {
    const { accounts, coinInfo, complete } = props.modal;
    const accountsCollection = accounts.map((a, index) => {
        const accountStatus: string = a.fresh ? 'Fresh account' : formatAmount(a.balance, coinInfo);
        // Loading...
        return (
            <div key={a} className="account account_default">
                <Button onClick={() => props.modalActions.onAccountSelect(index)}>
                    <span className="account_title">{a.label}</span>
                    <span className="account_status">{accountStatus}</span>
                </Button>
            </div>
        );
    });

    const header: string = complete
        ? `Select ${coinInfo.label} account`
        : `Loading ${coinInfo.label} accounts...`;

    return (
        <div>
            <h3>{header}</h3>
            <div className="account_type_tabs">
                <div data-tab="normal" className="account_type_tab account_type_normal active">
                    Accounts
                </div>
                <div data-tab="legacy" className="account_type_tab account_type_legacy">
                    Legacy Accounts
                </div>
            </div>
            <div className="accounts_list">{accountsCollection}</div>
        </div>
    );
};

export default AccountSelection;
