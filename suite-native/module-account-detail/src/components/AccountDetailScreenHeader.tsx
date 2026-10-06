import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { type Account } from '@suite-common/wallet-types';
import { isStakingSymbol } from '@suite-common/wallet-utils';
import { AccountDetailScreenHeaderContent } from '@suite-native/accounts';
import { IconButton, useBottomSheetModal } from '@suite-native/atoms';
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
