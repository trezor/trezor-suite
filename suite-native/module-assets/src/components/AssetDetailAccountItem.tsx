import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { useNavigateToAccount } from '@suite-native/accounts';
import { Box, HStack, PressableOpacity, Text } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';

import { useAssetDetailRouteParams } from '../hooks/useAssetDetailRouteParams';

type AssetDetailAccountItemProps = {
    accountKey: AccountKey;
    accountLabel?: string;
    cryptoBalance: string;
};

export const AssetDetailAccountItem = ({
    accountKey,
    accountLabel,
    cryptoBalance,
}: AssetDetailAccountItemProps) => {
    const { networkSymbol, tokenContract } = useAssetDetailRouteParams();
    const navigateToAccount = useNavigateToAccount();

    const handlePress = () => navigateToAccount({ accountKey, networkSymbol });

    const fiatValue = tokenContract ? (
        <TokenToFiatAmountFormatter
            symbol={networkSymbol}
            contract={tokenContract}
            value={cryptoBalance}
            variant="body-md-strong"
            numberOfLines={1}
            adjustsFontSizeToFit
        />
    ) : (
        <CryptoToFiatAmountFormatter
            symbol={networkSymbol}
            value={cryptoBalance}
            isBalance
            variant="body-md-strong"
            numberOfLines={1}
            adjustsFontSizeToFit
        />
    );

    return (
        <PressableOpacity onPress={handlePress} accessibilityRole="button">
            <HStack
                alignItems="center"
                justifyContent="space-between"
                spacing="sp12"
                paddingHorizontal="sp20"
                paddingVertical="sp12"
            >
                <Box flex={1}>
                    <Text variant="body-md" numberOfLines={1} ellipsizeMode="tail">
                        {accountLabel ?? getNetworkDisplaySymbolName(networkSymbol)}
                    </Text>
                </Box>
                {fiatValue}
            </HStack>
        </PressableOpacity>
    );
};
