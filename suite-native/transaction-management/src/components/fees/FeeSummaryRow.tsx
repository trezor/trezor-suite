import { type ReactNode } from 'react';

import { type NetworkSymbol, type NetworkType } from '@suite-common/wallet-config';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, ExactCryptoAmountFormatter } from '@suite-native/formatters';
import { Icon } from '@suite-native/icons';
import type { Color } from '@trezor/theme';

import { FeeLabelTranslation } from './FeeLabelTranslation';

export type FeeSummaryRowProps = {
    fee: string | null;
    symbol: NetworkSymbol;
    networkType: NetworkType;
    areFeesLoading: boolean;
    label?: ReactNode;
    withCaret?: boolean;
    baseValueOnly?: boolean;
};

type FeeValueProps = Pick<FeeSummaryRowProps, 'fee' | 'symbol' | 'areFeesLoading'>;

const BaseCurrencyFeeValue = ({
    fee,
    symbol,
    areFeesLoading,
    color,
}: FeeValueProps & { color: Color }) => (
    <HStack spacing="sp2" alignItems="center" justifyContent="flex-end">
        {!areFeesLoading && fee !== null && (
            <Text variant="body-sm" color={color}>
                ≈
            </Text>
        )}
        <CryptoToFiatAmountFormatter
            variant="body-sm"
            color={color}
            value={fee}
            symbol={symbol}
            isLoading={areFeesLoading}
            discreetMode="disabled"
            testID="@transactionManagement/fee-base-amount"
        />
    </HStack>
);

const FullFeeValues = ({ fee, symbol, areFeesLoading }: FeeValueProps) => (
    <VStack alignItems="flex-end" spacing="sp2">
        <ExactCryptoAmountFormatter
            variant="body-sm"
            color="contentPrimary"
            value={fee}
            symbol={symbol}
            isBalance={false}
            isLoading={areFeesLoading}
            // The user must be able to review the selected transaction fee.
            discreetMode="disabled"
            testID="@transactionManagement/fee-crypto-amount"
        />
        <BaseCurrencyFeeValue
            fee={fee}
            symbol={symbol}
            areFeesLoading={areFeesLoading}
            color="contentSecondary"
        />
    </VStack>
);

export const FeeSummaryRow = ({
    label,
    withCaret,
    baseValueOnly,
    networkType,
    ...rest
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
            {baseValueOnly ? (
                <BaseCurrencyFeeValue {...rest} color="contentPrimary" />
            ) : (
                <FullFeeValues {...rest} />
            )}
            {!!withCaret && <Icon name="caretDown" size="medium" color="contentSecondary" />}
        </HStack>
    </HStack>
);
