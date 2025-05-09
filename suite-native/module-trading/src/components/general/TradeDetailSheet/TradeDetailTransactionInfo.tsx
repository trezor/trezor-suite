import { useSelector } from 'react-redux';

import { CryptoId } from 'invity-api';

import {
    TradingRootState,
    cryptoIdToNetworkAndContractAddress,
    selectTradingTradeByOrderId,
} from '@suite-common/trading';
import { NetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    AccountsRootState,
    DeviceRootState,
    selectDeviceAccountByDescriptorAndNetworkSymbol,
} from '@suite-common/wallet-core';
import { Card, HStack, Text } from '@suite-native/atoms';
import { CryptoIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

import { TradeDetailInfoRow } from './TradeDetailInfoRow';
import { useChangeStringsExtractor } from '../../../hooks/useChangeStringsExtractor';

export type TradeDetailTransactionInfoProps = {
    orderId: string;
};

type CryptoIdIconProps = { cryptoId: CryptoId | undefined };

const CryptoIdIcon = ({ cryptoId }: CryptoIdIconProps) => {
    if (!cryptoId) {
        return null;
    }

    const { network, contractAddress } = cryptoIdToNetworkAndContractAddress(cryptoId);

    if (!network) {
        return null;
    }

    return (
        <CryptoIcon
            symbol={network.displaySymbol as NetworkDisplaySymbol}
            contractAddress={contractAddress}
            size="tiny"
        />
    );
};

export const TradeDetailTransactionInfo = ({ orderId }: TradeDetailTransactionInfoProps) => {
    const trade = useSelector((state: TradingRootState) =>
        selectTradingTradeByOrderId(state, orderId),
    );
    const account = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectDeviceAccountByDescriptorAndNetworkSymbol(
            state,
            trade?.account.descriptor,
            trade?.account.symbol,
        ),
    );

    const { fromStringValue, toStringValue, fromCryptoId, toCryptoId } =
        useChangeStringsExtractor(trade);

    if (!trade) {
        return null;
    }

    return (
        <Card noPadding>
            <TradeDetailInfoRow
                title={<Translation id="moduleTrading.tradeHistory.detail.paid" />}
                content={
                    <HStack alignItems="center" spacing="sp2">
                        <CryptoIdIcon cryptoId={fromCryptoId} />
                        <Text variant="hint">{fromStringValue}</Text>
                    </HStack>
                }
            />
            {trade.tradeType === 'sell' && (
                <TradeDetailInfoRow
                    title={<Translation id="moduleTrading.tradeHistory.detail.fromAccount" />}
                    content={account?.accountLabel}
                />
            )}
            <TradeDetailInfoRow
                title={<Translation id="moduleTrading.tradeHistory.detail.received" />}
                content={
                    <HStack alignItems="center" spacing="sp2">
                        <CryptoIdIcon cryptoId={toCryptoId} />
                        <Text variant="hint">{toStringValue}</Text>
                    </HStack>
                }
            />
            {trade.tradeType !== 'sell' && (
                <TradeDetailInfoRow
                    title={<Translation id="moduleTrading.tradeHistory.detail.toAccount" />}
                    content={account?.accountLabel}
                />
            )}
        </Card>
    );
};
