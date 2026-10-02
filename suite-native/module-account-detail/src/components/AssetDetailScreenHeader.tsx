import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type FiatRatesRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { isAccountFailed, isStakingSymbol } from '@suite-common/wallet-utils';
import {
    AccountLabel,
    type NativeAccountsRootState,
    selectAccountFiatBalance,
} from '@suite-native/accounts';
import { HStack, IconButton, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import { TokenSettingsBottomSheet } from '@suite-native/module-earn';
import {
    type AccountDetailStackParamList,
    AccountDetailStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { type TokensRootState, isNetworkWithTokens } from '@suite-native/tokens';

import { selectAssetTabOfAccountToken } from '../selectors';

type AccountDetailNavigationProps = StackNavigationProps<
    AccountDetailStackParamList,
    AccountDetailStackRoutes.AccountDetail
>;

type AssetDetailScreenHeaderContentProps = {
    account: Account;
    isBalanceDisplayed: boolean;
};

const AssetDetailScreenHeaderContent = ({
    account,
    isBalanceDisplayed,
}: AssetDetailScreenHeaderContentProps) => {
    const fiatBalance = useSelector((state: NativeAccountsRootState) =>
        isBalanceDisplayed ? selectAccountFiatBalance(state, account.key) : undefined,
    );

    return (
        <HStack alignItems="center" spacing="sp8">
            <TokenIcon tokenSymbol={account.symbol} networkSymbol={account.symbol} size="small" />

            <VStack spacing={0} alignItems="flex-start">
                <AccountLabel
                    account={account}
                    variant="body-md-strong"
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    showAccountTypeBadge
                />

                {isBalanceDisplayed && !isAccountFailed(account) && (
                    <BaseCurrencyAmountFormatter
                        value={fiatBalance}
                        variant="body-sm"
                        color="contentSecondary"
                    />
                )}
                {!isBalanceDisplayed && (
                    <Text variant="body-sm" color="contentSecondary">
                        {getNetworkDisplaySymbolName(account.symbol)}
                    </Text>
                )}
            </VStack>
        </HStack>
    );
};

type AssetDetailScreenSettingsButtonProps = {
    account: Account;
    tokenContract?: TokenAddress;
};

const AssetDetailScreenSettingsButton = ({
    account,
    tokenContract,
}: AssetDetailScreenSettingsButtonProps) => {
    const navigation = useNavigation<AccountDetailNavigationProps>();
    const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();

    const handleSettingsNavigation = () => {
        if (
            !!tokenContract ||
            isNetworkWithTokens(account.symbol) ||
            isStakingSymbol(account.symbol)
        ) {
            openModal();
        } else {
            navigation.navigate(AccountDetailStackRoutes.AccountSettings, {
                accountKey: account.key,
            });
        }
    };

    return (
        <>
            <IconButton
                intent="neutral"
                priority="secondary"
                size="medium"
                iconName="gear"
                onPress={handleSettingsNavigation}
                testID="@account-detail/settings-button"
            />

            <TokenSettingsBottomSheet
                ref={bottomSheetRef}
                accountKey={account.key}
                tokenContract={tokenContract}
                onNavigateAway={closeModal}
            />
        </>
    );
};

interface AssetDetailScreenHeaderProps {
    account: Account;
    tokenContract?: TokenAddress;
    isBalanceDisplayed?: boolean;
}

export const AssetDetailScreenHeader = ({
    account,
    tokenContract,
    isBalanceDisplayed = true,
}: AssetDetailScreenHeaderProps) => {
    const navigation = useNavigation<NativeStackNavigationProp<AccountDetailStackParamList>>();
    const route =
        useRoute<RouteProp<AccountDetailStackParamList, AccountDetailStackRoutes.AccountDetail>>();
    const { closeActionType } = route.params;

    const tokenTab = useSelector(
        (state: TokensRootState & FiatRatesRootState & WalletSettingsRootState) =>
            tokenContract
                ? selectAssetTabOfAccountToken(state, account.key, tokenContract)
                : undefined,
    );

    const closeAction = () => {
        const rootNavigation =
            navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();
        const isAccountOverviewInStack = rootNavigation
            ?.getState()
            .routes.some(stackRoute => stackRoute.name === RootStackRoutes.AccountOverview);

        if (rootNavigation && isAccountOverviewInStack) {
            rootNavigation.popTo(RootStackRoutes.AccountOverview, {
                accountKey: account.key,
                tab: tokenTab,
            });

            return;
        }

        navigation.goBack();
    };

    return (
        <ScreenHeader
            customContent={
                <AssetDetailScreenHeaderContent
                    account={account}
                    isBalanceDisplayed={isBalanceDisplayed}
                />
            }
            rightIcon={
                <AssetDetailScreenSettingsButton account={account} tokenContract={tokenContract} />
            }
            closeActionType={closeActionType}
            closeAction={closeAction}
        />
    );
};
