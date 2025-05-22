import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS, useFormatters } from '@suite-common/formatters';
import { DiscreetTextTrigger, HStack, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { useBuyFormContext } from '../../hooks/buy/useBuyFormContext';
import { getSelectedSymbolFromBuyForm } from '../../utils/general/tradeableAssetUtils';

export const RECEIVE_ACCOUNT_BALANCE_TEST_ID = '@trading/buy/receive-account-balance';

export const BuyReceiveAccountCryptoBalance = () => {
    const form = useBuyFormContext();
    const selectedSymbol = getSelectedSymbolFromBuyForm(form);
    const receiveAccount = form.watch('receiveAccount');
    const { DisplaySymbolFormatter } = useFormatters();

    const symbol = receiveAccount?.account?.symbol ?? selectedSymbol;
    const balance = receiveAccount?.account?.balance;

    if (!symbol) {
        return null;
    }

    return (
        <HStack testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID}>
            <Text variant="hint" color="textSubdued">
                <Translation id="moduleTrading.tradingScreen.balance" />
            </Text>
            {balance === undefined ? (
                <Text
                    variant="hint"
                    color="textSubdued"
                    testID={RECEIVE_ACCOUNT_BALANCE_TEST_ID + '/no-value'}
                >
                    - <DisplaySymbolFormatter value={symbol} />
                </Text>
            ) : (
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
            )}
        </HStack>
    );
};
