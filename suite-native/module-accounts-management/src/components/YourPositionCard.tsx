import { getDisplaySymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type Account, type TokenInfoBranded, type TokenSymbol } from '@suite-common/wallet-types';
import { Box, Card, HStack, Text } from '@suite-native/atoms';
import {
    CompactCryptoAmountFormatter,
    CompactTokenAmountFormatter,
    CryptoToFiatAmountFormatter,
    TokenToFiatAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { YieldBadge } from '@suite-native/module-earn';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { useYourPositionCardYieldBadge } from '../hooks/useYourPositionCardYieldBadge';

const cardStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItem: 'center',
    marginHorizontal: utils.spacings.sp16,
    padding: utils.spacings.sp16,
    backgroundColor: utils.colors.surfaceFillRaised,
    borderRadius: utils.borders.radii.r16,
}));

const cardContentStyle = prepareNativeStyle(_ => ({
    flexShrink: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
}));

interface YourPositionCardProps {
    account: Account;
    token: TokenInfoBranded | null;
}

export const YourPositionCard = ({ account, token }: YourPositionCardProps) => {
    const { applyStyle } = useNativeStyles();

    const { symbol } = account;

    const { yieldBadge, yieldBadgeVariant } = useYourPositionCardYieldBadge({
        account,
        token,
        symbol,
    });

    if (!symbol) return null;

    const tokenSymbol = token?.symbol ?? getDisplaySymbol(symbol);
    const tokenName = token?.name ?? getNetworkDisplaySymbolName(symbol);
    const balance = token?.balance ?? account?.formattedBalance ?? '0';
    const tokenAmountSymbol = token?.symbol
        ? (getDisplaySymbol(token.symbol) as TokenSymbol)
        : null;

    return (
        <Card style={applyStyle(cardStyle)} noShadow>
            <HStack alignItems="center" flex={1}>
                <Box marginRight="sp6">
                    <TokenIcon
                        symbol={symbol}
                        contractAddress={token?.contract}
                        showNetworkIcon
                        size="medium"
                    />
                </Box>

                <HStack alignItems="center" justifyContent="space-between" flex={1}>
                    <Box style={applyStyle(cardContentStyle)}>
                        <HStack>
                            <Text variant="body-sm-strong" color="contentPrimary">
                                {tokenSymbol}
                            </Text>

                            {yieldBadge && account && (
                                <YieldBadge
                                    apy={yieldBadge.apy}
                                    variant={yieldBadgeVariant}
                                    vaultId={yieldBadge.vaultId ?? ''}
                                    account={account}
                                />
                            )}
                        </HStack>

                        <Text variant="body-sm" color="contentSecondary" numberOfLines={1}>
                            {tokenName}
                        </Text>
                    </Box>

                    <Box alignItems="flex-end" flexShrink={1}>
                        {token ? (
                            <TokenToFiatAmountFormatter
                                symbol={symbol}
                                value={balance}
                                contract={token.contract}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                variant="body-sm-strong"
                                color="contentPrimary"
                            />
                        ) : (
                            <CryptoToFiatAmountFormatter
                                value={balance}
                                symbol={symbol}
                                isBalance={true}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                variant="body-sm-strong"
                            />
                        )}

                        {token ? (
                            <CompactTokenAmountFormatter
                                value={asDecimalTokenAmount(token.balance ?? '0')}
                                tokenSymbol={tokenAmountSymbol}
                                tokenDecimals={token.decimals}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                variant="body-sm"
                                color="contentSecondary"
                            />
                        ) : (
                            <CompactCryptoAmountFormatter
                                value={balance}
                                symbol={symbol}
                                isBalance={true}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                variant="body-sm"
                                color="contentSecondary"
                            />
                        )}
                    </Box>
                </HStack>
            </HStack>
        </Card>
    );
};
