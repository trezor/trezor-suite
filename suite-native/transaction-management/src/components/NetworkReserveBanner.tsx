import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { selectGetNetworkConfigDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectIsNetworkReserveEnabled } from '@suite-common/wallet-core';
import { getNetworkReserve } from '@suite-common/wallet-utils';
import { InlineAlertBox } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    SettingsStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProps = StackNavigationProps<RootStackParamList, RootStackRoutes>;

type NetworkReserveBannerProps = {
    symbol: NetworkSymbol;
    contractAddress?: string | null;
};

export const NetworkReserveBanner = ({ symbol, contractAddress }: NetworkReserveBannerProps) => {
    const { getNetworkConfig } = useServices(selectGetNetworkConfigDep);
    const navigation = useNavigation<NavigationProps>();
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const networkReserve = getNetworkReserve({
        getNetworkConfig,
        symbol,
        contractAddress,
        isEnabled: isNetworkReserveEnabled,
    });

    if (!networkReserve) return null;

    const { displaySymbol } = getNetworkConfig(symbol);

    const handleManagePress = () => {
        navigation.navigate(RootStackRoutes.SettingsScreenStack, {
            screen: SettingsStackRoutes.SettingsAdvanced,
        });
    };

    return (
        <InlineAlertBox
            intent="info"
            title={
                <Translation
                    id="transactionManagement.networkReserveBanner.title"
                    values={{ amount: networkReserve, displaySymbol }}
                />
            }
            buttonLabel={
                <Translation id="transactionManagement.networkReserveBanner.buttonTitle" />
            }
            onButtonPress={handleManagePress}
        />
    );
};
