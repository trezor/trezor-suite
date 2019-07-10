import React from 'react';

import LayoutAccount from '@wallet-components/LayoutAccount';

import EthereumTypeSendForm from './ethereum';
import RippleTypeSendForm from './ripple';
import BitcoinTypeSendForm from './bitcoin';

const AccountSend = () => {
    const network = { type: 'bitcoin' };
    return (
        <LayoutAccount>
            {network.type === 'bitcoin' && <BitcoinTypeSendForm />}
            {network.type === 'ethereum' && <EthereumTypeSendForm />}
            {network.type === 'ripple' && <RippleTypeSendForm />}
        </LayoutAccount>
    );
};

export default AccountSend;
