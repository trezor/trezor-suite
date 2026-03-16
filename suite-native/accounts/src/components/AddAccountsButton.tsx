import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceInViewOnlyMode, selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { IconButton } from '@suite-native/atoms';
import {
    AccountsImportStackRoutes,
    AddCoinAccountStackRoutes,
    type AddCoinFlowType,
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { useAccountAlerts } from '../hooks/useAccountAlerts';

type AddAccountButtonProps = {
    flowType: AddCoinFlowType;
    testID?: string;
};

export const AddAccountButton = ({ flowType, testID }: AddAccountButtonProps) => {
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountsImport>>();

    const hasDeviceDiscovery = useSelector(selectHasRunningDiscovery);
    const isSelectedDevicePortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);
    const { showViewOnlyAddAccountAlert } = useAccountAlerts();
    const isDeviceInViewOnlyMode = useSelector(selectIsDeviceInViewOnlyMode);

    const navigateToImportScreen = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const navigateToAddCoinAccount = () => {
        if (isDeviceInViewOnlyMode) {
            showViewOnlyAddAccountAlert();

            return;
        }
        navigation.navigate(RootStackRoutes.AddCoinAccountStack, {
            screen: AddCoinAccountStackRoutes.AddCoinAccount,
            params: {
                flowType,
            },
        });
    };

    return (
        <IconButton
            iconName="plus"
            onPress={
                isSelectedDevicePortfolioTracker ? navigateToImportScreen : navigateToAddCoinAccount
            }
            intent="neutral"
            priority="secondary"
            size="medium"
            isLoading={hasDeviceDiscovery}
            isDisabled={hasDeviceDiscovery}
            testID={`${testID}/${isSelectedDevicePortfolioTracker ? 'import' : 'add'}`}
        />
    );
};
