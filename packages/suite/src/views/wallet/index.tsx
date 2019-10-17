import React from 'react';
import { connect } from 'react-redux';

import Dashboard from '@wallet-views/dashboard/Container';

const Wallet = () => {
    return <Dashboard />;
};

export default connect()(Wallet);
