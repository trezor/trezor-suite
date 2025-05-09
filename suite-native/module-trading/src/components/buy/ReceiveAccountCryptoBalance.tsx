import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS } from '@suite-common/formatters';
import { DiscreetTextTrigger, HStack, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { useTradingBuyFormContext } from '../../hooks/useTradingBuyFormContext';

export const RECEIVE_ACCOUNT_BALANCE_TEST_ID = '@trading/buy/receive-account-balance';

export const ReceiveAccountCryptoBalance = () => {
    const form = useTradingBuyFormContext();
    const receiveAccount = form.watch('receiveAccount');

    const symbol = receiveAccount?.account?.symbol;
    const balance = receiveAccount?.account?.balance;

    if (!symbol || balance === undefined) {
        return null;
    }

    return (
        <HStack testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID}>
            <Text variant="hint" color="textSubdued">
                <Translation id="moduleTrading.tradingScreen.balance" />
            </Text>
            <DiscreetTextTrigger>
                <CryptoAmountFormatter
                    value={balance}
                    symbol={symbol}
                    variant="hint"
                    color="textSubdued"
                    isBalance={false}
                    decimals={BASE_CRYPTO_MAX_DISPLAYED_DECIMALS}
                    testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID + '/value'}
                />
            </DiscreetTextTrigger>
        </HStack>
    );
};
