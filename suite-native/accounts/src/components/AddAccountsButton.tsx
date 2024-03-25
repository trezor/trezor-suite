import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsImportStackRoutes,
    AddCoinAccountStackRoutes,
    AddCoinFlowType,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { IconButton } from '@suite-native/atoms';
import { selectDeviceDiscovery, selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';

type AddAccountButtonProps = {
    flowType: AddCoinFlowType;
};

export const AddAccountButton = ({ flowType }: AddAccountButtonProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountsImport>>();

    const isSelectedDevicePortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);
    const discovery = useSelector(selectDeviceDiscovery);
    const [isDeviceConnectEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);

    const shouldShowAddAccountButton =
        isSelectedDevicePortfolioTracker || (isDeviceConnectEnabled && !discovery);

    const navigateToImportScreen = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const navigateToAddCoinAccount = () => {
        navigation.navigate(RootStackRoutes.AddCoinAccountStack, {
            screen: AddCoinAccountStackRoutes.AddCoinAccount,
            params: {
                flowType,
            },
        });
    };

    return shouldShowAddAccountButton ? (
        <IconButton
            iconName="plus"
            onPress={
                isSelectedDevicePortfolioTracker ? navigateToImportScreen : navigateToAddCoinAccount
            }
            colorScheme="tertiaryElevation0"
            size="medium"
        />
    ) : null;
};
