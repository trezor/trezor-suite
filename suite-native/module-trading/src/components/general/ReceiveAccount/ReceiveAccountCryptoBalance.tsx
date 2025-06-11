import { BASE_CRYPTO_MAX_DISPLAYED_DECIMALS, useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { DiscreetTextTrigger, HStack, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

export type ReceiveAccountCryptoBalanceProps = {
    account: Account | undefined;
    defaultSymbol: NetworkSymbol | undefined;
    testID?: string;
};

export const ReceiveAccountCryptoBalance = ({
    account,
    defaultSymbol,
    testID,
}: ReceiveAccountCryptoBalanceProps) => {
    const { DisplaySymbolFormatter } = useFormatters();

    const symbol = account?.symbol ?? defaultSymbol;
    const balance = account?.balance;

    if (!symbol) {
        return null;
    }

    return (
        <HStack testID={testID}>
            <Text variant="hint" color="textSubdued">
                <Translation id="moduleTrading.tradingScreen.balance" />
            </Text>
            {balance === undefined ? (
                <Text
                    variant="hint"
                    color="textSubdued"
                    testID={testID ? `${testID}/no-value` : undefined}
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
                        testID={testID ? `${testID}/value` : undefined}
                    />
                </DiscreetTextTrigger>
            )}
        </HStack>
    );
};
