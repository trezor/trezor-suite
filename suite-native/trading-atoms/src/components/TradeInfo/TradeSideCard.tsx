import { ReactNode } from 'react';

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
};

export const TradeSideCard = ({ accountLabel, cryptoId, amount, title }: TradeSideCardProps) => {
    const { symbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);

    if (!symbol) {
        return null;
    }

    return (
        <NetworkAndAccountCard title={title} accountLabel={accountLabel} symbol={symbol}>
            <TradeInfoRow>
                <HStack alignItems="center">
                    <CryptoIcon
                        symbol={symbol}
                        contractAddress={contractAddress}
                        size="extraSmall"
                    />
                    {amount}
                </HStack>
            </TradeInfoRow>
        </NetworkAndAccountCard>
    );
};
