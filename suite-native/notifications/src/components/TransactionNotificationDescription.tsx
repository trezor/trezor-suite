import type { NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Text } from '@suite-native/atoms';
import { AccountAddressFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

type TransactionNotificationDescriptionProps = {
    amount: string | null;
    prefix: string;
    symbol: NetworkSymbol;
    targetAddress?: string;
};

const addressContainerStyle = prepareNativeStyle(_ => ({
    maxWidth: '35%',
}));

export const TransactionNotificationDescription = ({
    amount,
    prefix,
    targetAddress,
    symbol,
}: TransactionNotificationDescriptionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row">
            <CryptoAmountFormatter
                value={amount}
                symbol={symbol}
                isBalance={false}
                variant="label"
            />
            <Text color="textSubdued" variant="label">
                {` ${prefix} `}
            </Text>
            {targetAddress && (
                <Box style={applyStyle(addressContainerStyle)}>
                    <AccountAddressFormatter
                        value={targetAddress}
                        variant="label"
                        color="textSubdued"
                    />
                </Box>
            )}
        </Box>
    );
};
