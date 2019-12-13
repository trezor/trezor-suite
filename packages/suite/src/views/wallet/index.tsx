import React from 'react';
import { connect } from 'react-redux';

import WalletLayout from '@wallet-components/WalletLayout';
import Dashboard from '@wallet-views/dashboard/Container';

const Wallet = () => {
    return (
        <WalletLayout>
            <Dashboard />
        </WalletLayout>
    );
};

export default connect()(Wallet);
