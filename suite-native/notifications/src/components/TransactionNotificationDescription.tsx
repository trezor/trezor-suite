import { Box, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter, AccountAddressFormatter } from '@suite-native/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { useNativeStyles, prepareNativeStyle } from '@trezor/styles';

type TransactionNotificationDescriptionProps = {
    amount: string | null;
    prefix: string;
    networkSymbol: NetworkSymbol;
    targetAddress?: string;
};

const addressContainerStyle = prepareNativeStyle(_ => ({
    maxWidth: '35%',
}));

export const TransactionNotificationDescription = ({
    amount,
    prefix,
    targetAddress,
    networkSymbol,
}: TransactionNotificationDescriptionProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box flexDirection="row">
            <CryptoAmountFormatter
                value={amount}
                network={networkSymbol}
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
