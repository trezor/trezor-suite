import React from 'react';

import { Box, Card, DashboardSection, SearchInput, TransactionItem } from '@suite-native/atoms';

export const Transactions = () => (
    <DashboardSection title="Transactions">
        <Box marginBottom="large">
            <SearchInput value="" onChange={() => {}} placeholder="Find transactions..." />
        </Box>
        <Card>
            <TransactionItem
                cryptoCurrencySymbol="BTC"
                amountInCrypto={0.07812302}
                amountInFiat={23250}
                transactionStatus="received"
            />
            <TransactionItem
                cryptoCurrencySymbol="ETH"
                amountInCrypto={123}
                amountInFiat={23250}
                transactionStatus="sent"
            />
        </Card>
    </DashboardSection>
);
