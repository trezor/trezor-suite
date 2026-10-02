import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { Box, HStack, Text } from '@suite-native/atoms';
import { CryptoToFiatAmountFormatter, TokenToFiatAmountFormatter } from '@suite-native/formatters';

import { useAssetDetailRouteParams } from '../hooks/useAssetDetailRouteParams';

type AssetDetailAccountItemProps = {
    accountLabel?: string;
    cryptoBalance: string;
};

export const AssetDetailAccountItem = ({
    accountLabel,
    cryptoBalance,
}: AssetDetailAccountItemProps) => {
    const { networkSymbol, tokenContract } = useAssetDetailRouteParams();

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
    );
};
