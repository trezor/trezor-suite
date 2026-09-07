import { useCallback } from 'react';
import { useStore } from 'react-redux';

import type { FiatCurrencyCode } from 'invity-api';

import type { DeviceRootState } from '@suite-common/device';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useReceiveAmountMultiplier } from '@suite-native/trading-quote-utils';
import { type ReviewOutputItemListProps } from '@suite-native/transaction-management';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { CryptoAmountRow } from '../../components/general/CryptoAmountRow';
import { FiatAmountRow } from '../../components/general/FiatAmountRow';

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
            if (outputType !== 'traded_assets' || !send) {
                return undefined;
            }

            const cryptoReceive = receive && 'cryptoId' in receive ? receive : undefined;
            const fiatReceive = receive && 'fiatCurrency' in receive ? receive : undefined;

            // receive is undefined on a partial clear-signed swap — render send-only.
            const account = cryptoReceive
                ? selectAccountByKey(
                      getState() as AccountsRootState & DeviceRootState,
                      cryptoReceive.accountKey,
                  )
                : undefined;

            return (
                <VStack spacing="sp16">
                    <CryptoAmountRow
                        direction="from"
                        amount={send.amount}
                        cryptoId={send.cryptoId}
                        withNetworkIcon
                    />
                    {!!cryptoReceive && (
                        <CryptoAmountRow
                            direction="to"
                            amount={receiveAmountMultiplier(cryptoReceive.amount)}
                            cryptoId={cryptoReceive.cryptoId}
                            withNetworkIcon
                        />
                    )}
                    {!!fiatReceive && (
                        <FiatAmountRow
                            direction="to"
                            amount={fiatReceive.amount}
                            fiatCurrency={fiatReceive.fiatCurrency as FiatCurrencyCode}
                        />
                    )}
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
        },
        [getState, applyStyle, receiveAmountMultiplier],
    );
};
