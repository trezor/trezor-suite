import { useWindowDimensions } from 'react-native';
import { useSelector } from 'react-redux';

import { type GroupedBalanceMovementEventPayload } from '@suite-common/graph';
import { type SignValue } from '@suite-common/suite-types';
import { type TokenAddress } from '@suite-common/tokens';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { Box, Text } from '@suite-native/atoms';
import {
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    SignValueFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { GraphTooltip, getGraphTooltipPosition } from '@suite-native/price-chart';
import { type EventTooltipComponentProps } from '@suite-native/react-native-graph';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { isNotNullOrUndefined } from '@trezor/utils';

type TransactionEventTooltipProps = EventTooltipComponentProps<GroupedBalanceMovementEventPayload>;

type EventTooltipRowProps = {
    title: string;
    signValue: SignValue;
    value: number;
    symbol: NetworkSymbol;
    accountKey: AccountKey;
    tokenAddress?: TokenAddress;
};

const TokenAmountTooltipFormatter = ({
    accountKey,
    tokenAddress,
    symbol,
    value,
}: {
    accountKey: AccountKey;
    tokenAddress: TokenAddress;
    symbol: NetworkSymbol;
    value: number;
}) => {
    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenAddress),
    );
    const tokenDecimals = token?.decimals;

    if (!token?.symbol || !tokenDecimals) {
        return null;
    }

    // We might want to add support for other networks in the future.
    if (getNetworkType(symbol) === 'ethereum') {
        return (
            <ExactTokenAmountFormatter
                color="contentPrimary"
                variant="body-xs"
                value={asDecimalTokenAmount(value)}
                tokenSymbol={token.symbol}
            />
        );
    }

    return null;
};

const EventTooltipRow = ({
    title,
    signValue,
    symbol,
    tokenAddress,
    value,
    accountKey,
}: EventTooltipRowProps) => (
    <>
        <Text variant="body-xs" color="contentSecondary">
            {title}
        </Text>
        <Box flexDirection="row">
            <SignValueFormatter value={signValue} variant="body-xs" />
            {!tokenAddress ? (
                <ExactCryptoAmountFormatter
                    color="contentPrimary"
                    variant="body-xs"
                    value={value}
                    symbol={symbol}
                    isBalance={false}
                />
            ) : (
                <TokenAmountTooltipFormatter
                    accountKey={accountKey}
                    tokenAddress={tokenAddress}
                    symbol={symbol}
                    value={value}
                />
            )}
        </Box>
    </>
);

export const TransactionEventTooltip = ({
    eventX,
    eventY,
    eventPayload: {
        symbol,
        received,
        sent,
        receivedTransactionsCount,
        sentTransactionsCount,
        tokenAddress,
        accountKey,
    },
}: TransactionEventTooltipProps) => {
    const { width: windowWidth } = useWindowDimensions();

    const totalAmount = received && sent ? received - sent : null;

    const isSentDisplayed = sent !== 0 && sentTransactionsCount !== 0;
    const isReceivedDisplayed = received !== 0 && receivedTransactionsCount !== 0;

    return (
        <GraphTooltip positionStyle={getGraphTooltipPosition(eventX, eventY, windowWidth)}>
            {isSentDisplayed && (
                <EventTooltipRow
                    title={`Sent · ${sentTransactionsCount}`}
                    signValue="negative"
                    value={sent}
                    symbol={symbol}
                    tokenAddress={tokenAddress}
                    accountKey={accountKey}
                />
            )}
            {isReceivedDisplayed && (
                <EventTooltipRow
                    title={`Received · ${receivedTransactionsCount}`}
                    signValue="positive"
                    value={received}
                    symbol={symbol}
                    tokenAddress={tokenAddress}
                    accountKey={accountKey}
                />
            )}
            {isNotNullOrUndefined(totalAmount) && (
                <EventTooltipRow
                    title="In total"
                    signValue={totalAmount}
                    value={Math.abs(totalAmount)}
                    symbol={symbol}
                    tokenAddress={tokenAddress}
                    accountKey={accountKey}
                />
            )}
        </GraphTooltip>
    );
};
