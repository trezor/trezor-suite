import { getDisplaySymbol } from '@suite-common/wallet-config';
import { type Account, type TokenInfoBranded, toTokenSymbol } from '@suite-common/wallet-types';
import { Box, Card, HStack } from '@suite-native/atoms';
import {
    CryptoToFiatAmountFormatter,
    ExactCryptoAmountFormatter,
    ExactTokenAmountFormatter,
    TokenToFiatAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { YieldBadge } from '@suite-native/module-earn';
import { TokenName, TokenSymbol } from '@suite-native/tokens';
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

    const balance = token?.balance ?? account?.formattedBalance ?? '0';
    const tokenAmountSymbol = token?.symbol ? toTokenSymbol(getDisplaySymbol(token.symbol)) : null;

    return (
        <Card style={applyStyle(cardStyle)} noShadow>
            <HStack alignItems="center" flex={1}>
                <Box marginRight="sp6">
                    <TokenIcon
                        networkSymbol={symbol}
                        contractAddress={token?.contract}
                        tokenSymbol={token?.symbol || token?.name}
                        showNetworkIcon
                        size="medium"
                    />
                </Box>

                <HStack alignItems="center" justifyContent="space-between" flex={1}>
                    <Box style={applyStyle(cardContentStyle)}>
                        <HStack>
                            <TokenSymbol
                                networkSymbol={symbol}
                                tokenContract={token?.contract}
                                variant="body-sm-strong"
                                color="contentPrimary"
                            />

                            {yieldBadge && account && (
                                <YieldBadge
                                    apy={yieldBadge.apy}
                                    variant={yieldBadgeVariant}
                                    vaultId={yieldBadge.vaultId ?? ''}
                                    account={account}
                                />
                            )}
                        </HStack>

                        <TokenName
                            networkSymbol={symbol}
                            tokenContract={token?.contract}
                            variant="body-sm"
                            color="contentSecondary"
                            numberOfLines={1}
                        />
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
                            <ExactTokenAmountFormatter
                                value={asDecimalTokenAmount(token.balance ?? '0')}
                                tokenSymbol={tokenAmountSymbol}
                                networkSymbol={symbol}
                                tokenContract={token.contract}
                                maxDisplayedDecimals={token.decimals}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                variant="body-sm"
                                color="contentSecondary"
                            />
                        ) : (
                            <ExactCryptoAmountFormatter
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
