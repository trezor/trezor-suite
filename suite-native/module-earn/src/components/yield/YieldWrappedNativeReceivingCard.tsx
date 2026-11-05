import { type TokenAddress, type TokenSymbol } from '@suite-common/tokens';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, HStack, Text } from '@suite-native/atoms';
import {
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { TokenMetadataProvider } from '@suite-native/tokens';

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
    <TokenMetadataProvider
        networkSymbol={networkSymbol}
        tokens={
            tokenContract
                ? [{ contract: tokenContract, symbol: tokenSymbol, decimals: tokenDecimals }]
                : []
        }
    >
        <Card>
            <HStack justifyContent="space-between" alignItems="center">
                <Text variant="body-sm">
                    <Translation id="earn.yieldDepositFlowScreen.wrapReceivingLabel" />
                </Text>
                <HStack spacing="sp4" alignItems="center" flexShrink={1}>
                    <TokenIcon
                        networkSymbol={networkSymbol}
                        contractAddress={tokenContract}
                        tokenSymbol={tokenSymbol}
                        size="extraSmall"
                    />
                    {tokenContract ? (
                        <ExactTokenAmountFormatter
                            networkSymbol={networkSymbol}
                            contractAddress={tokenContract}
                            value={asDecimalTokenAmount(amount)}
                            variant="body-md-strong"
                            color="contentPrimary"
                            numberOfLines={1}
                        />
                    ) : (
                        <ExactCryptoAmountFormatter
                            symbol={networkSymbol}
                            value={asDecimalTokenAmount(amount)}
                            variant="body-md-strong"
                            color="contentPrimary"
                            numberOfLines={1}
                        />
                    )}
                </HStack>
            </HStack>
        </Card>
    </TokenMetadataProvider>
);
