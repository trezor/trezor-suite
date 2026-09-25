import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { isStakingSymbol } from '@suite-common/wallet-utils';
import { AccountLabel } from '@suite-native/accounts';
import { HStack, IconButton, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import { TokenSettingsBottomSheet } from '@suite-native/module-earn';
import {
    type AccountDetailStackParamList,
    AccountDetailStackRoutes,
    ScreenHeader,
    type StackNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { isNetworkWithTokens } from '@suite-native/tokens';

type AccountDetailScreenHeaderProps = {
    account: Account;
};

type AccountDetailNavigationProps = StackNavigationProps<
    AccountDetailStackParamList,
    AccountDetailStackRoutes.AccountDetail
>;

export const AccountDetailScreenHeaderContent = ({ account }: AccountDetailScreenHeaderProps) => (
    <HStack alignItems="center" flexShrink={1}>
        <TokenIcon
            tokenSymbol={account.symbol}
            networkSymbol={account.symbol}
            size="small"
            showNetworkIcon
        />
        <VStack spacing={0} flexShrink={1}>
            <Text variant="body-md-strong" numberOfLines={1} ellipsizeMode="tail">
                {getNetworkDisplaySymbolName(account.symbol)}
            </Text>
            <AccountLabel
                account={account}
                variant="body-xs"
                color="contentSecondary"
                numberOfLines={1}
                ellipsizeMode="tail"
                showAccountTypeBadge
            />
        </VStack>
    </HStack>
);

export const AccountDetailScreenHeader = ({ account }: AccountDetailScreenHeaderProps) => {
    const navigation = useNavigation<AccountDetailNavigationProps>();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const route =
        useRoute<RouteProp<AccountDetailStackParamList, AccountDetailStackRoutes.AccountDetail>>();
    const { closeActionType } = route.params;

    const { bottomSheetRef, closeModal, openModal } = useBottomSheetModal();

    const handleSettingsNavigation = () => {
        if (isNetworkWithTokens(account.symbol) || isStakingSymbol(account.symbol)) {
            openModal();
        } else {
            navigation.navigate(AccountDetailStackRoutes.AccountSettings, {
                accountKey: account.key,
            });
        }
    };

    return (
        <>
            <ScreenHeader
                customContent={<AccountDetailScreenHeaderContent account={account} />}
                rightIcon={
                    <IconButton
                        intent="neutral"
                        priority="secondary"
                        size="medium"
                        iconName="gear"
                        onPress={handleSettingsNavigation}
                        testID="@account-detail/settings-button"
                    />
                }
                closeActionType={closeActionType}
                closeAction={navigateToInitialScreen}
            />

            <TokenSettingsBottomSheet
                ref={bottomSheetRef}
                accountKey={account.key}
                onNavigateAway={closeModal}
            />
        </>
    );
};
