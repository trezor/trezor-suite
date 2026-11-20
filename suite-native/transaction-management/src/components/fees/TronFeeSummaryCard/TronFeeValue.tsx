import { type NetworkSymbol } from '@suite-common/wallet-config';
import { HStack, Text } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, ExactCryptoAmountFormatter } from '@suite-native/formatters';

type TronFeeValueProps = {
    trxBurned: string | null;
    areFeesLoading: boolean;
    resourceParts: string[];
    symbol: NetworkSymbol;
};

export const TronFeeValue = ({
    trxBurned,
    areFeesLoading,
    resourceParts,
    symbol,
}: TronFeeValueProps) => {
    const hasResourceCoverage = resourceParts.length > 0;
    if (trxBurned !== null) {
        return (
            <HStack alignItems="center" spacing="sp4">
                <ExactCryptoAmountFormatter
                    variant="body-sm"
                    color="contentPrimary"
                    value={trxBurned}
                    symbol={symbol}
                    isBalance
                    isLoading={areFeesLoading}
                    // Show the TRX burn amount so the user can assess the transaction cost.
                    discreetMode="disabled"
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
                    // Show the fiat equivalent of the TRX burn cost.
                    discreetMode="disabled"
                />
            </HStack>
        );
    }

    if (hasResourceCoverage) {
        return (
            <>
                {resourceParts.map(part => (
                    <Text key={part} variant="body-sm" color="contentPrimary">
                        {part}
                    </Text>
                ))}
            </>
        );
    }

    return (
        <ExactCryptoAmountFormatter
            variant="body-sm"
            color="contentPrimary"
            value={null}
            symbol={symbol}
            isBalance
            isLoading
            // Keep fee loading presentation independent of balance privacy.
            discreetMode="disabled"
            testID="@transactionManagement/tron-fee-crypto-amount"
        />
    );
};
