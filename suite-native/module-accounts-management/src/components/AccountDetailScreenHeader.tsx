import { useSelector } from 'react-redux';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { Account } from '@suite-common/wallet-types';
import { HStack, IconButton, Text } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import { CombinedLabelingState, selectAccountLabel } from '@suite-native/labeling';
import {
    AccountsStackParamList,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
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

const AccountDetailScreenHeaderContent = ({ account }: AccountDetailScreenHeaderProps) => {
    const accountLabel = useSelector((state: CombinedLabelingState) => {
        if (!account) return null;

        return selectAccountLabel(
            state,
            account.deviceState,
            account.descriptor,
            account.symbol,
            account.key,
        );
    });

    return (
        <HStack alignItems="center">
            <CryptoIconWithNetwork symbol={account.symbol} size="small" />
            <Text variant="highlight" adjustsFontSizeToFit numberOfLines={1}>
                {accountLabel}
            </Text>
        </HStack>
    );
};

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
                    colorScheme="tertiaryElevation0"
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
