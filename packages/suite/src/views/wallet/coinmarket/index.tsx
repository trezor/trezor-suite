import { WalletLayout } from '@wallet-components';
import { Card } from '@suite-components';
import { useSelector } from '@suite-hooks';
import React from 'react';
import styled from 'styled-components';

const StyledCard = styled(Card)`
    display: flex;
`;

const Coinmarket = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    return (
        <WalletLayout title="Coinmarket" account={selectedAccount}>
            <StyledCard>coin market</StyledCard>
        </WalletLayout>
    );
};

export default Coinmarket;
