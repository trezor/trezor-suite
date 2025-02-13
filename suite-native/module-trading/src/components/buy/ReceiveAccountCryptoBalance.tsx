import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Box, Text } from '@suite-native/atoms';

export type ReceiveAccountBalanceProps = {
    symbol: NetworkSymbol | undefined;
    balance: string | undefined;
};

export const RECEIVE_ACCOUNT_BALANCE_TEST_ID = '@module-trading/receive-account-balance';

export const ReceiveAccountCryptoBalance = ({ symbol, balance }: ReceiveAccountBalanceProps) => {
    const { CryptoAmountFormatter } = useFormatters();

    const shouldDisplayBalance = symbol && balance;

    return (
        <Box testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID}>
            {shouldDisplayBalance && (
                <Text variant="body" color="textSubdued">
                    <CryptoAmountFormatter value={balance} symbol={symbol} />
                </Text>
            )}
        </Box>
    );
};
