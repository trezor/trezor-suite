import { Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { G, N } from '@mobily/ts-belt';

import { GroupedBalanceMovementEventPayload } from '@suite-common/graph';
import { SignValue } from '@suite-common/suite-types';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { Box, Card, Text } from '@suite-native/atoms';
import {
    CryptoAmountFormatter,
    SignValueFormatter,
    TokenAmountFormatter,
} from '@suite-native/formatters';
import { EventTooltipComponentProps } from '@suite-native/react-native-graph/src/LineGraphProps';
import { TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

export type TransactionEventTooltipProps =
    EventTooltipComponentProps<GroupedBalanceMovementEventPayload>;

type EventTooltipRowProps = {
    title: string;
    signValue: SignValue;
    value: number;
    symbol: NetworkSymbol;
    accountKey: AccountKey;
    tokenAddress?: TokenAddress;
};

const SCREEN_WIDTH = Dimensions.get('screen').width;
const ANIMATION_DURATION = 200;
const TOOLTIP_LEFT_OFFSET = 25;
const TOOLTIP_RIGHT_OFFSET = 145;

const TooltipContainerStyle = prepareNativeStyle<{ x: number; y: number }>((_, { x, y }) => ({
    position: 'absolute',
    left: x + TOOLTIP_LEFT_OFFSET,
    top: N.clamp(0, 100, y), // The clamping prevents an Y axis overflow.
    extend: {
        // If the tooltip is on the right half of the screen,
        // render it on the left side of the referred event point to prevent an X axis overflow.
        condition: x > SCREEN_WIDTH / 2,
        style: {
            left: x - TOOLTIP_RIGHT_OFFSET,
        },
    },
}));

const TooltipCardStyle = prepareNativeStyle(utils => ({
    paddingVertical: utils.spacings.sp12,
    // fade in/out animation doesn't work for elevation (shadow) on Android
    elevation: 0,
}));

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
            <TokenAmountFormatter
                color="textDefault"
                variant="label"
                value={value}
                tokenSymbol={token.symbol}
                // decimals are already formatted in getAccountHistoryMovementItemETH
                decimals={0}
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
        <Text variant="label" color="textSubdued">
            {title}
        </Text>
        <Box flexDirection="row">
            <SignValueFormatter value={signValue} variant="label" />
            {!tokenAddress ? (
                <CryptoAmountFormatter
                    color="textDefault"
                    variant="label"
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
    const { applyStyle } = useNativeStyles();

    const totalAmount = received && sent ? received - sent : null;

    const isSentDisplayed = sent !== 0 && sentTransactionsCount !== 0;
    const isReceivedDisplayed = received !== 0 && receivedTransactionsCount !== 0;

    return (
        <Animated.View
            style={applyStyle(TooltipContainerStyle, { x: eventX, y: eventY })}
            entering={FadeIn.duration(ANIMATION_DURATION)}
            exiting={FadeOut.duration(ANIMATION_DURATION)}
        >
            <Card style={applyStyle(TooltipCardStyle)}>
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
                {G.isNotNullable(totalAmount) && (
                    <EventTooltipRow
                        title="In total"
                        signValue={totalAmount}
                        value={Math.abs(totalAmount)}
                        symbol={symbol}
                        tokenAddress={tokenAddress}
                        accountKey={accountKey}
                    />
                )}
            </Card>
        </Animated.View>
    );
};
