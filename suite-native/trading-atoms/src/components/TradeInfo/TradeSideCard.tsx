import type { PropsWithChildren, ReactNode } from 'react';

import type { CryptoId } from 'invity-api';

import { cryptoIdToNetworkSymbolAndContractAddress } from '@suite-common/trading';
import { HStack } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';

import { NetworkAndAccountCard } from './NetworkAndAccountCard';
import { TradeInfoRow } from './TradeInfoRow';

export type TradeSideCardProps = {
    accountLabel?: ReactNode;
    cryptoId?: CryptoId;
    amount: ReactNode;
    title: ReactNode;
} & PropsWithChildren;

export const TradeSideCard = ({
    accountLabel,
    cryptoId,
    amount,
    title,
    children,
}: TradeSideCardProps) => {
    const { symbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);

    if (!symbol) {
        return null;
    }

    return (
        <NetworkAndAccountCard title={title} accountLabel={accountLabel} symbol={symbol}>
            <TradeInfoRow>
                <HStack justifyContent="space-between" alignItems="center" flex={1}>
                    <HStack alignItems="center">
                        <CryptoIcon
                            symbol={symbol}
                            contractAddress={contractAddress}
                            size="extraSmall"
                        />
                        {amount}
                    </HStack>
                    {children}
                </HStack>
            </TradeInfoRow>
        </NetworkAndAccountCard>
    );
};
