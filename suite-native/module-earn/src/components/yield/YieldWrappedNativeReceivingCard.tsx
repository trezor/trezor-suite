import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress, type TokenSymbol } from '@suite-common/wallet-types';
import { Card, HStack, Text } from '@suite-native/atoms';
import { CryptoAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';

type YieldWrappedNativeReceivingCardProps = {
    amount: string;
    networkSymbol: NetworkSymbol;
    /** Left out for the native coin, which a wrap spends and an unwrap gives back. */
    tokenContract?: TokenAddress;
    tokenDecimals: number;
    tokenSymbol: TokenSymbol;
};

export const YieldWrappedNativeReceivingCard = ({
    amount,
    networkSymbol,
    tokenContract,
    tokenDecimals,
    tokenSymbol,
}: YieldWrappedNativeReceivingCardProps) => (
    <Card>
        <HStack justifyContent="space-between" alignItems="center">
            <Text variant="body-sm">
                <Translation id="earn.yieldDepositFlowScreen.wrapReceivingLabel" />
            </Text>
            <HStack spacing="sp4" alignItems="center" flexShrink={1}>
                <TokenIcon
                    symbol={networkSymbol}
                    contractAddress={tokenContract}
                    size="extraSmall"
                />
                <CryptoAmountFormatter
                    value={amount}
                    symbol={tokenSymbol}
                    decimals={tokenDecimals}
                    variant="body-md-strong"
                    color="contentPrimary"
                    numberOfLines={1}
                />
            </HStack>
        </HStack>
    </Card>
);
