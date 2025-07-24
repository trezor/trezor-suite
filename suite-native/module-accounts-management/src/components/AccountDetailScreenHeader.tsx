import { useSelector } from 'react-redux';

import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import { AccountsRootState, selectAccountNetworkSymbol } from '@suite-common/wallet-core';
import { HStack, IconButton, Text } from '@suite-native/atoms';
import { CryptoIconWithNetwork } from '@suite-native/icons';
import {
    AccountsStackParamList,
    RootStackParamList,
    RootStackRoutes,
    ScreenHeader,
    StackToStackCompositeNavigationProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

type AccountDetailScreenHeaderProps = {
    accountLabel: string | null;
    accountKey: string;
};

type AccountDetailNavigationProps = StackToStackCompositeNavigationProps<
    AccountsStackParamList,
    RootStackRoutes.AccountDetail,
    RootStackParamList
>;

const AccountDetailScreenHeaderContent = ({
    accountLabel,
    accountKey,
}: AccountDetailScreenHeaderProps) => {
    const symbol = useSelector((state: AccountsRootState) =>
        selectAccountNetworkSymbol(state, accountKey),
    );

    if (!symbol) {
        return null;
    }

    return (
        <HStack alignItems="center">
            <CryptoIconWithNetwork symbol={symbol} size="small" />
            <Text variant="highlight" adjustsFontSizeToFit numberOfLines={1}>
                {accountLabel}
            </Text>
        </HStack>
    );
};

export const AccountDetailScreenHeader = ({
    accountLabel,
    accountKey,
}: AccountDetailScreenHeaderProps) => {
    const navigation = useNavigation<AccountDetailNavigationProps>();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const { closeActionType } = route.params;

    const handleSettingsNavigation = () => {
        navigation.navigate(RootStackRoutes.AccountSettings, {
            accountKey,
        });
    };

    return (
        <ScreenHeader
            customContent={
                <AccountDetailScreenHeaderContent
                    accountLabel={accountLabel}
                    accountKey={accountKey}
                />
            }
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
