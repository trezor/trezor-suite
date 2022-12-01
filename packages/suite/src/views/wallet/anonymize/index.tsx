import React from 'react';

import { useSelector } from '@suite-hooks';
import { WalletLayoutHeader } from '@wallet-components';
import { CoinjoinSetupStrategies } from '@wallet-views/anonymize/components/CoinjoinSetupStrategies';
import { WalletLayout } from '@wallet-components/WalletLayout';

const Anonymize = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    return (
        <WalletLayout title="TR_NAV_ANONYMIZE" account={selectedAccount}>
            {selectedAccount.status === 'loaded' && (
                <>
                    <WalletLayoutHeader title="TR_NAV_ANONYMIZE" />
                    <CoinjoinSetupStrategies account={selectedAccount.account} />
                </>
            )}
        </WalletLayout>
    );
};

export default Anonymize;
