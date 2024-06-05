import { useNavigation, RouteProp, useRoute } from '@react-navigation/native';

import { IconButton } from '@suite-native/atoms';
import {
    AccountsStackParamList,
    RootStackParamList,
    RootStackRoutes,
    ScreenSubHeader,
    StackToStackCompositeNavigationProps,
    GoBackIcon,
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

export const AccountDetailScreenHeader = ({
    accountLabel,
    accountKey,
}: AccountDetailScreenHeaderProps) => {
    const navigation = useNavigation<AccountDetailNavigationProps>();
    const route = useRoute<RouteProp<RootStackParamList, RootStackRoutes.AccountDetail>>();
    const { closeActionType } = route.params;

    const handleSettingsNavigation = () => {
        navigation.navigate(RootStackRoutes.AccountSettings, {
            accountKey,
        });
    };

    return (
        <ScreenSubHeader
            content={accountLabel}
            rightIcon={
                <IconButton
                    colorScheme="tertiaryElevation0"
                    size="medium"
                    iconName="settings"
                    onPress={handleSettingsNavigation}
                    testID="@account-detail/settings-button"
                />
            }
            leftIcon={<GoBackIcon closeActionType={closeActionType} />}
        />
    );
};
