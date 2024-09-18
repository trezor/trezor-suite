import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

import { G, N } from '@mobily/ts-belt';

import { Card, Text } from '@suite-native/atoms';
import {
    CryptoAmountFormatter,
    EthereumTokenAmountFormatter,
    SignValueFormatter,
} from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { GroupedBalanceMovementEventPayload } from '@suite-common/graph';
import { EventTooltipComponentProps } from '@suite-native/react-native-graph/src/LineGraphProps';
import { SignValue } from '@suite-common/suite-types';
import { NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import { AccountsRootState } from '@suite-common/wallet-core';
import {
    selectEthereumAccountTokenInfo,
    selectEthereumAccountTokenSymbol,
} from '@suite-native/tokens';

export type TransactionEventTooltipProps =
    EventTooltipComponentProps<GroupedBalanceMovementEventPayload>;

type EventTooltipRowProps = {
    title: string;
    signValue: SignValue;
    value: number;
    networkSymbol: NetworkSymbol;
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
    paddingVertical: 1.5 * utils.spacings.small,
    // fade in/out animation doesn't work for elevation (shadow) on Android
    elevation: 0,
}));

const TokenAmountTooltipFormatter = ({
    accountKey,
    tokenAddress,
    networkSymbol,
    value,
}: {
    accountKey: AccountKey;
    tokenAddress: TokenAddress;
    networkSymbol: NetworkSymbol;
    value: number;
}) => {
    const tokenInfo = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenInfo(state, accountKey, tokenAddress),
    );
    const tokenSymbol = useSelector((state: AccountsRootState) =>
        selectEthereumAccountTokenSymbol(state, accountKey, tokenAddress),
    );
    const tokenDecimals = tokenInfo?.decimals;

    if (!tokenSymbol || !tokenDecimals) {
        return null;
    }

    // We might want to add support for other networks in the future.
    if (getNetworkType(networkSymbol) === 'ethereum') {
        return (
            <EthereumTokenAmountFormatter
                color="textDefault"
                variant="label"
                value={value}
                symbol={tokenSymbol}
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
    networkSymbol,
    tokenAddress,
    value,
    accountKey,
}: EventTooltipRowProps) => (
    <>
        <Text variant="label" color="textSubdued">
            {title}
        </Text>
        <Text>
            <SignValueFormatter value={signValue} variant="label" />
            {!tokenAddress ? (
                <CryptoAmountFormatter
                    color="textDefault"
                    variant="label"
                    value={value}
                    network={networkSymbol}
                    isBalance={false}
                />
            ) : (
                <TokenAmountTooltipFormatter
                    accountKey={accountKey}
                    tokenAddress={tokenAddress}
                    networkSymbol={networkSymbol}
                    value={value}
                />
            )}
        </Text>
    </>
);

export const TransactionEventTooltip = ({
    eventX,
    eventY,
    eventPayload: {
        networkSymbol,
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
                        networkSymbol={networkSymbol}
                        tokenAddress={tokenAddress}
                        accountKey={accountKey}
                    />
                )}
                {isReceivedDisplayed && (
                    <EventTooltipRow
                        title={`Received · ${receivedTransactionsCount}`}
                        signValue="positive"
                        value={received}
                        networkSymbol={networkSymbol}
                        tokenAddress={tokenAddress}
                        accountKey={accountKey}
                    />
                )}
                {G.isNotNullable(totalAmount) && (
                    <EventTooltipRow
                        title="In total"
                        signValue={totalAmount}
                        value={Math.abs(totalAmount)}
                        networkSymbol={networkSymbol}
                        tokenAddress={tokenAddress}
                        accountKey={accountKey}
                    />
                )}
            </Card>
        </Animated.View>
    );
};
