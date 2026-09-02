import { type ReactNode } from 'react';

import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';

import { FeeLabelTranslation } from './FeeLabelTranslation';

export type FeeSummaryRowProps = {
    fee: string | null;
    symbol: NetworkSymbol;
    networkType: NetworkType;
    areFeesLoading: boolean;
    label?: ReactNode;
    withCaret?: boolean;
};

export const FeeSummaryRow = ({
    fee,
    symbol,
    networkType,
    areFeesLoading,
    label,
    withCaret,
}: FeeSummaryRowProps) => (
    <HStack
        justifyContent="space-between"
        alignItems="center"
        paddingHorizontal="sp16"
        paddingVertical="sp12"
    >
        <VStack spacing="sp4">
            <Text variant="body-sm" color="contentSecondary">
                {label ?? <FeeLabelTranslation networkType={networkType} />}
            </Text>
        </VStack>
        <HStack alignItems="center" spacing="sp8">
            <VStack alignItems="flex-end" spacing="sp2">
                <ExactCryptoAmountFormatter
                    variant="body-sm"
                    color="contentPrimary"
                    value={fee}
                    symbol={symbol}
                    isBalance={false}
                    isLoading={areFeesLoading}
                    isDiscreetText={false}
                    testID="@transactionManagement/fee-crypto-amount"
                />
                <HStack spacing="sp2" alignItems="center" justifyContent="flex-end">
                    {!areFeesLoading && fee !== null && (
                        <Text variant="body-sm" color="contentSecondary">
                            ≈
                        </Text>
                    )}
                    <CryptoToFiatAmountFormatter
                        variant="body-sm"
                        color="contentSecondary"
                        value={fee}
                        symbol={symbol}
                        isLoading={areFeesLoading}
                        isDiscreetText={false}
                    />
                </HStack>
            </VStack>
            {!!withCaret && <Icon name="caretDown" size="medium" color="contentSecondary" />}
        </HStack>
    </HStack>
);
