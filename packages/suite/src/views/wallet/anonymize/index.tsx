import React from 'react';
import styled from 'styled-components';

import { useSelector } from '@suite-hooks';
import { WalletLayoutHeader } from '@wallet-components';
import { AnonymityLevelSetup } from '@wallet-components/PrivacyAccount/AnonymityLevelSetup';
import { CoinjoinSetupStrategies } from '@wallet-views/anonymize/components/CoinjoinSetupStrategies';
import { WalletLayout } from '@wallet-components/WalletLayout';

const StyledAnonymityLevelSetup = styled(AnonymityLevelSetup)`
    margin-right: 12px;
`;

const Anonymize = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    return (
        <WalletLayout title="TR_NAV_ANONYMIZE" account={selectedAccount}>
            {selectedAccount.status === 'loaded' && (
                <>
                    <WalletLayoutHeader title="TR_NAV_ANONYMIZE">
                        <StyledAnonymityLevelSetup />
                    </WalletLayoutHeader>
                    <CoinjoinSetupStrategies account={selectedAccount.account} />
                </>
            )}
        </WalletLayout>
    );
};

export default Anonymize;
