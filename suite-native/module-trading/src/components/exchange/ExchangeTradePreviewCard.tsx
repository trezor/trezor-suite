import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { CryptoId } from 'invity-api';

import { cryptoIdToNetworkSymbolAndContractAddress } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    selectAccountLabel,
    selectAccountNetworkSymbol,
} from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Card, HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoIcon, NetworkIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { TradeInfoHeader } from '../TradeInfo/TradeInfoHeader';
import { TradeInfoRow } from '../TradeInfo/TradeInfoRow';

type ExchangeTradePreviewProps = {
    account: Account;
    cryptoId?: CryptoId;
    amount: ReactNode;
    title: ReactNode;
};

export const ExchangeTradePreviewCard = ({
    account,
    cryptoId,
    amount,
    title,
}: ExchangeTradePreviewProps) => {
    const accountLabel = useSelector((state: AccountsRootState) =>
        account ? selectAccountLabel(state, account.key) : null,
    );

    const networkSymbol = useSelector((state: AccountsRootState) =>
        account ? selectAccountNetworkSymbol(state, account.key) : null,
    );

    if (!cryptoId) {
        return null;
    }

    const { symbol, contractAddress } = cryptoIdToNetworkSymbolAndContractAddress(cryptoId);

    if (!symbol) {
        return null;
    }

    const fromNetworkName = networkSymbol && getNetwork(networkSymbol)?.name;

    return (
        <Card noPadding>
            <TradeInfoHeader
                title={title}
                rightContent={
                    !!networkSymbol && (
                        <HStack alignItems="center">
                            <NetworkIcon symbol={networkSymbol} size="extraLarge" />
                            <Text variant="hint">{fromNetworkName}</Text>
                        </HStack>
                    )
                }
            />
            <TradeInfoRow>
                <VStack spacing="sp4">
                    <Text variant="hint">
                        <Translation id="moduleTrading.exchangeTradePreviewCard.account" />
                    </Text>
                    <Text variant="hint" color="textSubdued">
                        {accountLabel}
                    </Text>
                </VStack>
            </TradeInfoRow>
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
        </Card>
    );
};
