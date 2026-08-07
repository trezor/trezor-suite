import { useSelector } from 'react-redux';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { type NativeStackNavigationProp } from '@react-navigation/native-stack';

import { type FiatRatesRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { isAccountFailed, isStakingSymbol } from '@suite-common/wallet-utils';
import {
    AccountLabel,
    type NativeAccountsRootState,
    selectAccountFiatBalance,
} from '@suite-native/accounts';
import { HStack, IconButton, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { TokenIcon } from '@suite-native/icons';
import {
    type AccountsStackParamList,
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { type TokensRootState, isNetworkWithTokens } from '@suite-native/tokens';

import { TokenSettingsBottomSheet } from './TokenSettingsBottomSheet';
import { selectAssetTabOfAccountToken } from '../selectors';

type AccountDetailNavigationProps = StackToStackCompositeNavigationProps<
    AccountsStackParamList,
    RootStackRoutes.AccountDetail,
    RootStackParamList
>;

type AssetDetailScreenHeaderContentProps = {
    account: Account;
};

const AssetDetailScreenHeaderContent = ({ account }: AssetDetailScreenHeaderContentProps) => {
    const fiatBalance = useSelector((state: NativeAccountsRootState) =>
        selectAccountFiatBalance(state, account.key),
    );

    return (
        <HStack alignItems="center" spacing="sp8">
            <TokenIcon symbol={account.symbol} size="small" />

            <VStack spacing={0} alignItems="flex-start">
                <AccountLabel
                    account={account}
                    variant="body-md-strong"
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    showAccountTypeBadge
                />

                {!isAccountFailed(account) && (
                    <BaseCurrencyAmountFormatter
                        value={fiatBalance}
                        variant="body-sm"
                        color="contentSecondary"
                    />
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
            navigation.navigate(RootStackRoutes.AccountSettings, {
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
}

export const AssetDetailScreenHeader = ({
    account,
    tokenContract,
}: AssetDetailScreenHeaderProps) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const { closeActionType } = route.params;

    const tokenTab = useSelector(
        (state: TokensRootState & FiatRatesRootState & WalletSettingsRootState) =>
            tokenContract
                ? selectAssetTabOfAccountToken(state, account.key, tokenContract)
                : undefined,
    );

    const closeAction = () => {
        const isAccountAssetsInStack = navigation
            .getState()
            .routes.some(stackRoute => stackRoute.name === RootStackRoutes.AccountAssets);

        if (isAccountAssetsInStack) {
            navigation.popTo(RootStackRoutes.AccountAssets, {
                accountKey: account.key,
                tab: tokenTab,
            });
        } else {
            navigation.goBack();
        }
    };

    return (
        <ScreenHeader
            customContent={<AssetDetailScreenHeaderContent account={account} />}
            rightIcon={
                <AssetDetailScreenSettingsButton account={account} tokenContract={tokenContract} />
            }
            closeActionType={closeActionType}
            closeAction={closeAction}
        />
    );
};
