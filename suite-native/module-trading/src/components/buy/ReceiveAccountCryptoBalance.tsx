import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Box, DiscreetTextTrigger } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';

export type ReceiveAccountBalanceProps = {
    symbol: NetworkSymbol | undefined;
    balance: string | undefined;
};

export const RECEIVE_ACCOUNT_BALANCE_TEST_ID = '@module-trading/receive-account-balance';

export const ReceiveAccountCryptoBalance = ({ symbol, balance }: ReceiveAccountBalanceProps) => {
    const shouldDisplayBalance = symbol && balance;

    return (
        <Box testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID}>
            {shouldDisplayBalance && (
                <DiscreetTextTrigger>
                    <CryptoAmountFormatter
                        value={balance}
                        symbol={symbol}
                        variant="body"
                        color="textSubdued"
                        isBalance={false}
                        decimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
                    />
                </DiscreetTextTrigger>
            )}
        </Box>
    );
};
