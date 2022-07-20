import React from 'react';

import { Card, TransactionItem } from '@suite-native/atoms';

import { DashboardSection } from './DashboardSection';

export const Transactions = () => (
    <DashboardSection title="Transactions">
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
