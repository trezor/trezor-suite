import { useCallback } from 'react';
import { useStore } from 'react-redux';

import type { DeviceRootState } from '@suite-common/device';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useReceiveAmountMultiplier } from '@suite-native/trading-quote-utils';
import { type ReviewOutputItemListProps } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CryptoAmountRow } from '../../components/general/CryptoAmountRow';

type ContentBuilderFunction = NonNullable<ReviewOutputItemListProps['contentBuilder']>;

const flexStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
}));

export const useTradingContentBuilder = (): ContentBuilderFunction => {
    const { getState } = useStore();
    const { applyStyle } = useNativeStyles();
    const receiveAmountMultiplier = useReceiveAmountMultiplier();

    return useCallback(
        ({ outputType, send, receive }) => {
            if (outputType === 'traded_assets') {
                if (!send || !receive || !('cryptoId' in receive)) {
                    return undefined;
                }

                const account = selectAccountByKey(
                    getState() as AccountsRootState & DeviceRootState,
                    receive.accountKey,
                );

                return (
                    <VStack spacing="sp16">
                        <CryptoAmountRow
                            direction="from"
                            amount={send.amount}
                            cryptoId={send.cryptoId}
                            withNetworkIcon
                        />
                        <CryptoAmountRow
                            direction="to"
                            amount={receiveAmountMultiplier(receive.amount)}
                            cryptoId={receive.cryptoId}
                            withNetworkIcon
                        />
                        {!!account && (
                            <HStack justifyContent="space-between" spacing="sp16">
                                <Text variant="body-sm" color="contentPrimary">
                                    <Translation id="moduleTrading.tradingReviewOutputs.tradedAssets.recipient" />
                                </Text>
                                <Text
                                    variant="body-sm-strong"
                                    color="contentPrimary"
                                    style={applyStyle(flexStyle)}
                                >
                                    {account.descriptor}
                                </Text>
                            </HStack>
                        )}
                    </VStack>
                );
            }

            return undefined;
        },
        [getState, applyStyle, receiveAmountMultiplier],
    );
};
