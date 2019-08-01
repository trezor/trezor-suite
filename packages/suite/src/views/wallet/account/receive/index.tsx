import React from 'react';

import LayoutAccount from '@wallet-components/LayoutAccount';

import EthereumTypeReceiveForm from './ethereum';
import RippleTypeReceiveForm from './ripple';
import BitcoinTypeReceiveForm from './bitcoin';

const AccountReceive = () => {
    const network = { type: 'ethereum' };

    // do the logic here

    return (
        <LayoutAccount>
            {network.type === 'bitcoin' && <BitcoinTypeReceiveForm />}
            {network.type === 'ethereum' && <EthereumTypeReceiveForm />}
            {network.type === 'ripple' && <RippleTypeReceiveForm />}
        </LayoutAccount>
    );
};

export default AccountReceive;
