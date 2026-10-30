import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type YieldClaimAccountItem,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { toTokenSymbol } from '@suite-common/wallet-types';
import { AccountLabel } from '@suite-native/accounts';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { Box, HStack, PressableOpacity, Text, VStack } from '@suite-native/atoms';
import {
    BaseCurrencyAmountFormatter,
    CompactTokenAmountFormatter,
    asDecimalTokenAmount,
} from '@suite-native/formatters';
import { Icon, TokenIcon } from '@suite-native/icons';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
    YieldStackRoutes,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const rowStyle = prepareNativeStyle(utils => ({
    minHeight: 80,
    paddingLeft: utils.spacings.sp16,
    paddingRight: utils.spacings.sp12,
    paddingVertical: utils.spacings.sp12,
    flexDirection: 'row',
    alignItems: 'center',
}));

const contentStyle = prepareNativeStyle(_ => ({
    flex: 1,
    overflow: 'hidden',
}));

const tabularNumbersStyle = prepareNativeStyle(() => ({
    fontVariant: ['tabular-nums'],
}));

const tokenAmountsStyle = prepareNativeStyle(() => ({
    flexShrink: 1,
    fontVariant: ['tabular-nums'],
}));

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.YieldNavigator>;

type YieldClaimRewardsAccountCardProps = {
    item: YieldClaimAccountItem;
    onClose: () => void;
};

export const YieldClaimRewardsAccountCard = ({
    item,
    onClose,
}: YieldClaimRewardsAccountCardProps) => {
    const { analytics } = useServices(injectNativeAnalytics);
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<NavigationProp>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, item.summary.accountKey),
    );

    const onPress = () => {
        onClose();

        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'earn-dashboard',
                to: 'claim-form',
                networkSymbol: item.summary.networkSymbol,
            },
        });

        navigation.navigate(RootStackRoutes.YieldNavigator, {
            screen: YieldStackRoutes.YieldClaim,
            params: {
                accountKey: item.summary.accountKey,
                vault: item.vaults.length === 1 ? item.vaults[0] : undefined,
            },
        });
    };

    return (
        <PressableOpacity onPress={onPress} style={applyStyle(rowStyle)}>
            <Box marginRight="sp12">
                <TokenIcon
                    tokenSymbol={item.summary.networkSymbol}
                    networkSymbol={item.summary.networkSymbol}
                    size="small"
                />
            </Box>

            <VStack spacing="sp4" style={applyStyle(contentStyle)}>
                {account ? (
                    <AccountLabel
                        account={account}
                        showAccountTypeBadge
                        variant="body-md-strong"
                        numberOfLines={1}
                    />
                ) : (
                    <Text variant="body-md-strong" numberOfLines={1}>
                        {getNetworkDisplaySymbolName(item.summary.networkSymbol)}
                    </Text>
                )}

                <VStack spacing="sp1">
                    {item.summary.tokens.map(token => (
                        <CompactTokenAmountFormatter
                            key={`${token.symbol}:${token.contractAddress}`}
                            value={asDecimalTokenAmount(token.claimableAmount)}
                            tokenSymbol={toTokenSymbol(token.symbol)}
                            numberOfLines={2}
                            variant="body-xs"
                            color="contentSecondary"
                            style={applyStyle(tokenAmountsStyle)}
                        />
                    ))}
                </VStack>
            </VStack>

            <HStack spacing="sp8" alignItems="center" marginLeft="sp8">
                <BaseCurrencyAmountFormatter
                    value={item.summary.fiatClaimableAmount}
                    variant="body-md-strong"
                    numberOfLines={1}
                    style={applyStyle(tabularNumbersStyle)}
                />
                <Icon name="caretRight" size="mediumLarge" color="contentSecondary" />
            </HStack>
        </PressableOpacity>
    );
};
