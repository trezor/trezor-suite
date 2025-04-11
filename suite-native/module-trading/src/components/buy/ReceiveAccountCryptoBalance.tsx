import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { Box, DiscreetTextTrigger } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';

import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';

export const RECEIVE_ACCOUNT_BALANCE_TEST_ID = '@module-trading/receive-account-balance';

export const ReceiveAccountCryptoBalance = () => {
    const form = useTradingBuyFormContext();
    const [receiveAccount] = form.watch(['receiveAccount']);

    const symbol = receiveAccount?.account?.symbol;
    const balance = receiveAccount?.account?.balance;
    const shouldDisplayBalance = symbol && balance;

    return (
        <Box testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID} paddingVertical="sp12">
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
