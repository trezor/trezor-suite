import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
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
    const navigation = useNavigation<NavigationProps>();
    const isNetworkReserveEnabled = useSelector(selectIsNetworkReserveEnabled);

    const networkReserve = getNetworkReserve({
        symbol,
        contractAddress,
        isEnabled: isNetworkReserveEnabled,
    });

    if (!networkReserve) return null;

    const { displaySymbol } = getNetwork(symbol);

    const handleManagePress = () => {
        navigation.navigate(RootStackRoutes.SettingsScreenStack, {
            screen: SettingsStackRoutes.SettingsAdvanced,
        });
    };

    return (
        <InlineAlertBox
            variant="info"
            viewLeft={<></>}
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
