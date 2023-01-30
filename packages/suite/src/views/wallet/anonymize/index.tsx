import React from 'react';

import { useSelector } from '@suite-hooks';
import { WalletLayoutHeader } from '@wallet-components';
import { CoinjoinConfirmation } from '@wallet-views/anonymize/components/CoinjoinConfirmation';
import { WalletLayout } from '@wallet-components/WalletLayout';

const Anonymize = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    return (
        <WalletLayout title="TR_NAV_ANONYMIZE" account={selectedAccount}>
            {selectedAccount.status === 'loaded' && (
                <>
                    <WalletLayoutHeader title="TR_NAV_ANONYMIZE" />
                    <CoinjoinConfirmation account={selectedAccount.account} />
                </>
            )}
        </WalletLayout>
    );
};

export default Anonymize;
