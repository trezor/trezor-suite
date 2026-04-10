import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { type Account } from '@suite-common/wallet-types';
import { HStack, IconButton, Text } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { AccountLabel } from '@suite-native/labeling';
import {
    type AccountsStackParamList,
    type RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    type StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

type AccountDetailScreenHeaderProps = {
    account: Account;
};

type AccountDetailNavigationProps = StackToStackCompositeNavigationProps<
    AccountsStackParamList,
    RootStackRoutes.AccountDetail,
    RootStackParamList
>;

const AccountDetailScreenHeaderContent = ({ account }: AccountDetailScreenHeaderProps) => (
    <HStack alignItems="center">
        <CryptoIconWithNetwork symbol={account.symbol} size="small" />
        <Text variant="body-md-strong" adjustsFontSizeToFit numberOfLines={1}>
            <AccountLabel account={account} />
        </Text>
    </HStack>
);

export const AccountDetailScreenHeader = ({ account }: AccountDetailScreenHeaderProps) => {
    const navigation = useNavigation<AccountDetailNavigationProps>();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const { closeActionType } = route.params;

    const handleSettingsNavigation = () => {
        navigation.navigate(RootStackRoutes.AccountSettings, {
            accountKey: account.key,
        });
    };

    return (
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
    );
};
