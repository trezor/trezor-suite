import { useMemo } from 'react';

import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenSymbol } from '@suite-common/wallet-types';
import { Card, HStack, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type YieldSupplyApprovedAmountCardProps = {
    accountSymbol: NetworkSymbol;
    amount: string;
    tokenContract?: string;
    tokenSymbol: TokenSymbol;
};

export const YieldSupplyApprovedAmountCard = ({
    accountSymbol,
    amount,
    tokenContract,
    tokenSymbol,
}: YieldSupplyApprovedAmountCardProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    const formattedAmount = useMemo(
        () =>
            CryptoAmountFormatter.format(amount, {
                symbol: tokenSymbol,
                isBalance: true,
                withSymbol: true,
                isEllipsisAppended: false,
                maxDisplayedDecimals: 8,
            }),
        [amount, CryptoAmountFormatter, tokenSymbol],
    );

    return (
        <Card noPadding>
            <HStack justifyContent="space-between" alignItems="center" padding="sp16">
                <Text variant="body-sm">
                    <Translation id="earn.yieldSupplyFlowScreen.approvedAmount" />
                </Text>
                <HStack spacing="sp4" alignItems="center">
                    <CryptoIcon symbol={accountSymbol} contractAddress={tokenContract} size={20} />
                    <Text variant="body-sm-strong">{formattedAmount}</Text>
                </HStack>
            </HStack>
        </Card>
    );
};
