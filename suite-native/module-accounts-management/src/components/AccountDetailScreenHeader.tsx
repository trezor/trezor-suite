import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { isStakingSymbol } from '@suite-common/wallet-utils';
import { AccountLabel } from '@suite-native/accounts';
import { HStack, IconButton, Text, VStack, useBottomSheetModal } from '@suite-native/atoms';
import { TokenIcon } from '@suite-native/icons';
import {
    type AccountsStackParamList,
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { isNetworkWithTokens } from '@suite-native/tokens';

import { TokenSettingsBottomSheet } from './TokenSettingsBottomSheet';

type AccountDetailScreenHeaderProps = {
    account: Account;
};

type AccountDetailNavigationProps = StackToStackCompositeNavigationProps<
    AccountsStackParamList,
    RootStackRoutes.AccountDetail,
    RootStackParamList
>;

const AccountDetailScreenHeaderContent = ({ account }: AccountDetailScreenHeaderProps) => (
    <HStack alignItems="center" flexShrink={1}>
        <TokenIcon symbol={account.symbol} size="small" showNetworkIcon />
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
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const { closeActionType } = route.params;

    const { bottomSheetRef, openModal } = useBottomSheetModal();

    const handleSettingsNavigation = () => {
        if (isNetworkWithTokens(account.symbol) || isStakingSymbol(account.symbol)) {
            openModal();
        } else {
            navigation.navigate(RootStackRoutes.AccountSettings, {
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

            <TokenSettingsBottomSheet ref={bottomSheetRef} accountKey={account.key} />
        </>
    );
};
