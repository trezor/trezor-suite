import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { Card, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { NetworkAndAccountCard } from '@suite-native/trading-atoms';
import { selectExchangeSelectedSendAccount } from '@suite-native/trading-state';

import { ProviderInfoRow } from '../../general/TradeInfo/ProviderInfoRow';
import { RevokeLimitInfoRow } from '../Approval/RevokeLimitInfoRow';

export type ExchangeRevokeConfirmationDetailsProps = {
    exchange: string | undefined;
    feeRow: ReactNode;
    transactionIdRow: ReactNode;
};

// Read-only counterpart of ExchangeRevokeDetails for a standalone revoke.
export const ExchangeRevokeConfirmationDetails = ({
    exchange,
    feeRow,
    transactionIdRow,
}: ExchangeRevokeConfirmationDetailsProps) => {
    const account = useSelector(selectExchangeSelectedSendAccount);

    if (!account) {
        return null;
    }

    return (
        <VStack spacing="sp12">
            <NetworkAndAccountCard
                account={account}
                title={<Translation id="moduleTrading.exchangeTradePreviewCard.account" />}
            >
                <ProviderInfoRow exchange={exchange} tradingType="exchange" />
                <RevokeLimitInfoRow />
                {transactionIdRow}
            </NetworkAndAccountCard>
            <Card noPadding>{feeRow}</Card>
        </VStack>
    );
};
