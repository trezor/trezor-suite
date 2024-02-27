import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    AccountsImportStackRoutes,
    AddCoinAccountStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { IconButton } from '@suite-native/atoms';
import { selectDeviceDiscovery, selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';

import { useIsAddCoinAccountEnabled } from '../useIsAddCoinAccountEnabled';

export const AddAccountButton = () => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountsImport>>();

    const isSelectedDevicePortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);
    const discovery = useSelector(selectDeviceDiscovery);

    const { isAddCoinAccountEnabled } = useIsAddCoinAccountEnabled();

    const shouldShowAddAccountButton =
        isSelectedDevicePortfolioTracker || (isAddCoinAccountEnabled && !discovery);

    const navigateToImportScreen = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const navigateToAddCoinAccount = () => {
        if (isAddCoinAccountEnabled) {
            navigation.navigate(RootStackRoutes.AddCoinAccountStack, {
                screen: AddCoinAccountStackRoutes.AddCoinAccount,
                params: {
                    flowType: 'accounts',
                },
            });
        }
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
