import { type ReactNode } from 'react';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { TradeInfoHeader } from './TradeInfoHeader';
import { TradeInfoRow } from './TradeInfoRow';

export type NetworkAndAccountCardProps = {
    title: ReactNode;
    accountLabel?: ReactNode;
    symbol: NetworkSymbol;
    children?: ReactNode;
};

export const NetworkAndAccountCard = ({
    title,
    accountLabel,
    symbol,
    children,
}: NetworkAndAccountCardProps) => {
    const networkName = getNetwork(symbol)?.name;

    return (
        <Card noPadding>
            <TradeInfoHeader
                title={title}
                rightContent={
                    !!symbol && (
                        <HStack alignItems="center">
                            <NetworkIcon symbol={symbol} size="extraLarge" />
                            <Text variant="body-sm">{networkName}</Text>
                        </HStack>
                    )
                }
            />
            <TradeInfoRow>
                <VStack spacing="sp4">
                    <Text variant="body-sm">
                        <Translation id="moduleTrading.exchangeTradePreviewCard.account" />
                    </Text>
                    <Text variant="body-sm" color="textSubdued">
                        {accountLabel}
                    </Text>
                </VStack>
            </TradeInfoRow>
            {children}
        </Card>
    );
};
