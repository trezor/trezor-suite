import { type NetworkSymbol } from '@suite-common/wallet-config';
import { HStack, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';

type TronFeeValueProps = {
    trxBurned: string | null;
    areFeesLoading: boolean;
    resourceLabel: string;
    symbol: NetworkSymbol;
};

export const TronFeeValue = ({
    trxBurned,
    areFeesLoading,
    resourceLabel,
    symbol,
}: TronFeeValueProps) => {
    const hasResourceCoverage = !!resourceLabel;
    if (trxBurned !== null) {
        return (
            <HStack alignItems="center" spacing="sp4">
                <CryptoAmountFormatter
                    variant="body-sm"
                    color="contentPrimary"
                    value={trxBurned}
                    symbol={symbol}
                    isBalance
                    isLoading={areFeesLoading}
                    isDiscreetText={false}
                    testID="@transactionManagement/tron-fee-crypto-amount"
                />
                {!areFeesLoading && (
                    <Text variant="body-sm" color="contentPrimary">
                        ≈
                    </Text>
                )}
                <CryptoToFiatAmountFormatter
                    variant="body-sm"
                    color="contentPrimary"
                    value={trxBurned}
                    symbol={symbol}
                    isBalance
                    isLoading={areFeesLoading}
                    isDiscreetText={false}
                />
            </HStack>
        );
    }

    if (hasResourceCoverage) {
        return (
            <Text variant="body-sm" color="contentPrimary">
                {resourceLabel}
            </Text>
        );
    }

    return (
        <CryptoAmountFormatter
            variant="body-sm"
            color="contentPrimary"
            value={null}
            symbol={symbol}
            isBalance
            isLoading
            isDiscreetText={false}
            testID="@transactionManagement/tron-fee-crypto-amount"
        />
    );
};
