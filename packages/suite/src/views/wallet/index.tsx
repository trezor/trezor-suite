import React from 'react';
import { connect } from 'react-redux';

import Dashboard from '@wallet-views/dashboard';

const Wallet = () => {
    return <Dashboard />;
};

export default connect()(Wallet);
